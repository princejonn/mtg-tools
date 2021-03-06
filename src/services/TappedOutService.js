import flatten from "lodash/flatten";
import Commander from "models/Commander";
import TappedOutDeck from "models/TappedOutDeck";
import TappedOutLinkList from "models/TappedOutLinkList";
import ScryfallCacheService from "services/ScryfallService";
import ShareLinkService from "services/ShareLinkService";
import BasePage from "utils/BasePage";
import CacheTimeout from "utils/CacheTimeout";
import NeDB, { Collection } from "utils/NeDB";
import RateLimit from "utils/RateLimit";
import Spinners from "utils/Spinners";
import Logger from "utils/Logger";

const Selector = {
  PAGE_LOADED: ".pull-left",
  USERNAME: "input#id_username",
  PASSWORD: "input#id_password",
  SUBMIT: "input.submit",
  LOGGED_IN: "div.tabbable ul.nav li.active",
  EMBED_MODAL: "a[href='#embed-modal']",
  SHARE_LINK: "input.form-control.share-code.state-private-share-f",
  COMMANDER: "ul.boardlist > a",
  COMMANDER_NAME: ".well-jumbotron h1",
  HUB: "#id_hubs option",
  SEARCH_FILTER_BUTTON: "input[value='Filter results']",
  DECK_LINK: "h3.deck-wide-header a",
  DECK_CHART: "#combined-chart",
  CARD_LIST: "div.well div.board-container",
  MEMBER: "ul.boardlist > li.member",
  CARD: "a.board",
  CARD_LINK: "span > a",
};

class TappedOutService extends BasePage {
  constructor() {
    super();
    this._logger = Logger.getContextLogger("tapped-out-service");
    this._hubsName = "hubs";
    this._loggedIn = false;
    this._commanders = new NeDB(Collection.COMMANDERS);
    this._hubs = new NeDB(Collection.HUBS);
    this._links = new NeDB(Collection.LINKS);
    this._decks = new NeDB(Collection.DECKS);
    this._searchUrl = "https://tappedout.net/mtg-decks/search/";
    this._maxPages = 10;
  }

  /**
   * @param {string} url
   * @returns {Promise<Commander>}
   */
  async getCommander(url) {
    this._logger.debug("getting commander from url", url);

    const timeout = new CacheTimeout({ years: 1 });

    const commander = ShareLinkService.getCommanderId(url);
    const cached = await this._commanders.find({ commander });

    if (cached && timeout.isOK(cached.created)) {
      return new Commander(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      await this._commanders.remove({ commander });
    }

    const data = await this._buildCommander({ commander, url });
    await this._commanders.insert(data);

    return new Commander(data);
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutBudget} budget
   * @param {TappedOutTopDeck} top
   * @param {string} hubs
   * @param {string} cards
   * @returns {Promise<TappedOutLinkList>}
   */
  async getSimilarLinks({ commander, budget, top, hubs, cards }) {
    this._logger.debug("getting similar links", { commander, budget, top, hubs, cards });

    const timeout = new CacheTimeout({ days: 14 });

    const query = {
      commander: commander.queryString,
      price: budget.price,
      top: top.num,
      hubs: "",
      cards: "",
    };

    if (hubs) {
      query.hubs = hubs;
    }
    if (cards) {
      query.cards = cards;
    }

    const cached = await this._links.find(query);

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutLinkList(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      await this._links.remove({ commander: commander.queryString });
    }

    const data = await this._buildSimilarLinks({ commander, budget, top, hubs, cards });
    await this._links.insert(data);

    return new TappedOutLinkList(data);
  }

  /**
   * @returns {Promise<TappedOutLinkList>}
   */
  async getTopLinks() {
    this._logger.debug("getting top links");

    const timeout = new CacheTimeout({ minutes: 21 });
    const cached = await this._links.find({ name: "top-links" });

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutLinkList(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      await this._links.remove({ name: "top-links" });
    }

    const data = await this._buildTopLinks();
    await this._links.insert(data);

    return new TappedOutLinkList(data);
  }

  /**
   * @param {string} url
   * @param {boolean} cacheDeck
   * @returns {Promise<TappedOutDeck>}
   */
  async getDeck(url, cacheDeck = true) {
    this._logger.debug("getting deck at url", url);

    const timeout = new CacheTimeout({ days: 7 });
    const cached = await this._decks.find({ url });

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutDeck(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      await this._decks.remove({ url });
    }

    const data = await this._buildDeck(url);

    if (cacheDeck) {
      await this._decks.insert(data);
    }

    return new TappedOutDeck(data);
  }

  /**
   * @returns {Promise<Array<string>>}
   */
  async getValidHubs() {
    this._logger.debug("getting valid hubs");

    const name = this._hubsName;
    const timeout = new CacheTimeout({ months: 3 });
    const cached = await this._hubs.find({ name });

    if (cached && timeout.isOK(cached.created)) {
      return cached.list;
    } if (cached && !timeout.isOK(cached.created)) {
      await this._hubs.remove({ name });
    }

    Spinners.next("fetching hubs");
    const data = await this._buildHubs();
    await this._hubs.insert({
      name,
      list: data,
    });
    Spinners.succeed();

    return data;
  }

  /**
   * @param {TappedOutAccount} account
   * @returns {Promise<void>}
   */
  async login(account) {
    this._logger.debug("logging in username", account.username);

    if (this._loggedIn) return;

    Spinners.next("logging in");
    await super._init();

    await RateLimit.tappedOut();
    await super.goto({
      url: "https://tappedout.net/accounts/login/?next=/",
      waitForSelector: Selector.USERNAME,
    });
    await super.type(Selector.USERNAME, account.username);
    await super.type(Selector.PASSWORD, account.password);
    await super.click(Selector.SUBMIT);
    await super.waitFor(Selector.LOGGED_IN);

    Spinners.succeed();
    this._loggedIn = true;
  }

  destroy() {
    this._manager.destroy();
  }

  //
  // Private
  //

  /**
   * @param {string} commander
   * @param {string} url
   * @returns {Promise<{commander: string, name: string, url: string}>}
   * @private
   */
  async _buildCommander({ commander, url }) {
    this._logger.debug("building commander", { commander, url });

    await super._init();

    await RateLimit.tappedOut();
    await super.goto({
      url,
      waitForSelector: Selector.CARD,
    });

    await super.waitFor(Selector.COMMANDER);
    await super.click(Selector.COMMANDER);

    const element = await super.find(Selector.COMMANDER_NAME);

    let name = await super.getText(element);

    name = name.replace(/\s{2,}/g, "");
    name = name.replace(/\n/g, "");

    return { commander, name, url };
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutBudget} budget
   * @param {TappedOutTopDeck} top
   * @param {string} hubs
   * @param {string} cards
   * @returns {Promise<{commander: string, price: number, links: Array<string>}>}
   * @private
   */
  async _buildSimilarLinks({ commander, budget, top, hubs, cards }) {
    this._logger.debug("building similar links", { commander, budget, top, hubs, cards });

    await super._init();

    const baseUrl = `${this._searchUrl}?q=&format=edh&general=${commander.queryString}&o=-rating&submit=Filter+results`;

    let links = [];
    let page = 1;
    let position = 1;

    while (page <= this._maxPages) {
      let searchUrl = `${baseUrl}&p=${page}&page=${page}`;

      if (budget.price > 0) {
        searchUrl += `&price_0=&price_1=${budget.price}`;
      } else {
        searchUrl += "&price_0=&price_1=";
      }

      if (top.value) {
        searchUrl += "&is_top=on";
      }

      if (hubs) {
        searchUrl += `&hubs=${hubs}`;
      }

      if (cards) {
        searchUrl += `&cards=${cards}`;
      }

      const result = await this._getLinksOnPage(searchUrl, position);

      links = flatten([ ...links, ...result.links ]);
      position = result.position;
      page += 1;
    }

    return {
      commander: commander.queryString,
      price: budget.num,
      top: top.num,
      hubs,
      cards,
      links,
    };
  }

  /**
   * @returns {Promise<{name: string, links: Array<string>}>}
   * @private
   */
  async _buildTopLinks() {
    this._logger.debug("building top links");

    await super._init();

    const baseUrl = `${this._searchUrl}?q=&format=edh&price_0=&price_1=&o=-rating&submit=Filter+results`;
    const colours = [
      "R", // red
      "G", // green
      "U", // blue
      "W", // white
      "B", // black
    ];

    let links = [];

    for (const colour of colours) {
      let page = 1;
      let position = 1;

      while (page <= this._maxPages) {
        const searchUrl = `${baseUrl}&color=${colour}&p=${page}&page=${page}`;
        const result = await this._getLinksOnPage(searchUrl, position);

        links = flatten([ ...links, ...result.links ]);
        position = result.position;
        page += 1;
      }
    }

    return {
      name: "top-links",
      links,
    };
  }

  /**
   * @param {string} pageUrl
   * @param {number} position
   * @returns {Promise<{links: Array<string>, position: number}>}
   * @private
   */
  async _getLinksOnPage(pageUrl, position) {
    this._logger.debug("getting links on page", pageUrl);

    const links = [];

    try {
      await RateLimit.tappedOut();
      await super.goto({
        url: pageUrl,
        waitForSelector: Selector.PAGE_LOADED,
      });
      await super.waitFor(Selector.SEARCH_FILTER_BUTTON, 5000);
      await this.waitFor(Selector.DECK_LINK, 5000);
      const elements = await this.findAll(Selector.DECK_LINK);

      this._logger.debug("found # elements", elements.length);

      for (const element of elements) {
        const href = await super.getAttribute(element, "href");
        const url = `https://tappedout.net${href}?cat=type&sort=name`;
        this._logger.debug("found link", url);
        links.push({ position, url });
        position += 1;
      }
    } catch (err) {
      this._logger.error(err);
    }

    return { links, position };
  }

  /**
   * @returns {Promise<Array<string>>}
   * @private
   */
  async _buildHubs() {
    this._logger.debug("building hubs");

    await super._init();

    await RateLimit.tappedOut();
    await super.goto({
      url: this._searchUrl,
      waitForSelector: Selector.HUB,
    });

    const elements = await super.findAll(Selector.HUB);
    const list = [];

    this._logger.debug("found # elements", elements.length);

    for (const element of elements) {
      const value = await super.getAttribute(element, "value");
      list.push(value);
    }

    return list;
  }

  /**
   * @param {string} url
   * @returns {Promise<{url: string, cards: Array<Card>}>}
   * @private
   */
  async _buildDeck(url) {
    this._logger.debug("building deck at url", url);

    await super._init();

    const cards = [];
    let tries = 1;

    while (tries <= 3) {
      try {
        await RateLimit.tappedOut();
        await super.goto({
          url,
          waitForSelector: Selector.DECK_CHART,
        });

        const parents = await super.findAll(Selector.CARD_LIST, 5000);
        const mainBoard = parents[0];
        const cardItems = await mainBoard.$$(Selector.MEMBER);

        this._logger.debug("found # card items", cardItems.length);

        for (const item of cardItems) {
          const card = await item.$(Selector.CARD);
          const amountString = await super.getAttribute(card, "data-qty");
          let name = await super.getAttribute(card, "data-name");
          const amount = parseInt(amountString, 10);

          const flip = await item.$$(Selector.CARD_LINK);

          if (flip.length > 1) {
            const flipLink = flip[1];
            const flipName = await super.getAttribute(flipLink, "data-name");
            if (flipName) {
              name = `${name} // ${flipName}`;
            }
          }

          const cachedCard = await ScryfallCacheService.find(name);
          if (!cachedCard.id) continue;

          cards.push({
            id: cachedCard.id,
            tappedOut: {amount},
          });
        }

        return { url, cards };
      } catch (err) {
        this._logger.error(err);
        await TappedOutService._removeShareLink(url);
        tries += 1;
      }
    }

    return { url, cards: [] };
  }

  /**
   * @param {string} url
   * @returns {Promise<void>}
   * @private
   */
  static async _removeShareLink(url) {
    if (!ShareLinkService.isShare(url)) return;
    await ShareLinkService.remove(url);
  }
}

const service = new TappedOutService();

export default service;
