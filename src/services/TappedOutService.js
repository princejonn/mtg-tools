import Commander from "models/Commander";
import TappedOutDeck from "models/TappedOutDeck";
import TappedOutLinkList from "models/TappedOutLinkList";
import ScryfallCacheService from "services/ScryfallService";
import BasePage from "utils/BasePage";
import CacheTimeout from "utils/CacheTimeout";
import NeDB, { Collection } from "utils/NeDB";
import RateLimit from "utils/RateLimit";
import TimerMessage from "utils/TimerMessage";

const Selector = {
  USERNAME: "input#id_username",
  PASSWORD: "input#id_password",
  SUBMIT: "input.submit",
  LOGGED_IN: "div.tabbable ul.nav li.active",
  COMMANDER: "ul.boardlist > a",
  COMMANDER_NAME: ".well-jumbotron h1",
  HUB: "#id_hubs option",
  DECK_LINK: "h3.deck-wide-header a",
  CARD_LIST: "div.well div.board-container",
  MEMBER: "ul.boardlist > li.member",
  CARD: "a.board",
  CARD_LINK: "span > a",
};

class TappedOutService extends BasePage {
  constructor() {
    super();
    this._hubsName = "hubs";
    this._loggedIn = false;
    this._commanders = new NeDB(Collection.COMMANDERS);
    this._hubs = new NeDB(Collection.HUBS);
    this._links = new NeDB(Collection.LINKS);
    this._decks = new NeDB(Collection.DECKS);
    this._searchUrl = "https://tappedout.net/mtg-decks/search/";
  }

  /**
   * @param {string} url
   * @param {TappedOutAccount} account
   * @returns {Promise<Commander>}
   */
  async getCommander(url, account) {
    const timeout = new CacheTimeout({ years: 1 });
    const cached = await this._commanders.find({ url });

    if (cached && timeout.isOK(cached.created)) {
      return new Commander(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found commander in database with expired timeout:", url);
      await this._commanders.remove({ url });
    }

    console.log("searching for commander on tapped out:", url);
    const data = await this._buildCommander(url, account);
    await this._commanders.insert(data);

    return new Commander(data);
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutAccount} account
   * @returns {Promise<TappedOutDeck>}
   */
  async getCommanderDeck(commander, account) {
    const timerMessage = new TimerMessage("finding commander deck");
    await super._init();
    await this._login(account);
    const data = await this._buildDeck(commander.url);
    timerMessage.done();
    return new TappedOutDeck(data);
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutBudget} budget
   * @param {string} hubs
   * @returns {Promise<TappedOutLinkList>}
   */
  async getSimilarLinks(commander, budget, hubs) {
    const timeout = new CacheTimeout({ days: 14 });

    const query = {
      commander: commander.queryString,
      price: budget.price,
    };

    if (hubs) {
      query.hubs = hubs;
    }

    const cached = await this._links.find(query);

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutLinkList(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found links in database with expired timeout:", commander.queryString);
      await this._links.remove({ commander: commander.queryString });
    }

    console.log("searching for links on tapped out:", commander.queryString);
    const data = await this._buildSimilarLinks(commander, budget, hubs);
    await this._links.insert(data);

    return new TappedOutLinkList(data);
  }

  /**
   * @param {string} url
   * @returns {Promise<TappedOutDeck>}
   */
  async getDeck(url) {
    const timeout = new CacheTimeout({ days: 7 });
    const cached = await this._decks.find({ url });

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutDeck(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found deck in database with expired timeout:", url);
      await this._decks.remove({ url });
    }

    try {
      const data = await this._buildDeck(url);
      await this._decks.insert(data);

      return new TappedOutDeck(data);
    } catch (err) {
      console.log("unable to build deck:", url);
    }
  }

  /**
   * @returns {Promise<Array<string>>}
   */
  async getValidHubs() {
    const name = this._hubsName;
    const timeout = new CacheTimeout({ months: 3 });
    const cached = await this._hubs.find({ name });

    if (cached && timeout.isOK(cached.created)) {
      return cached.list;
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found hubs in database with expired timeout");
      await this._hubs.remove({ name });
    }

    console.log("searching for hubs on tapped out");
    const data = await this._buildHubs();
    await this._hubs.insert({
      name,
      list: data,
    });

    return data;
  }

  /**
   * @param {string} url
   * @param {TappedOutAccount} account
   * @returns {Promise<{name: string, url: string}>}
   * @private
   */
  async _buildCommander(url, account) {
    await super._init();
    await this._login(account);

    const timerMessage = new TimerMessage("finding commander");

    await RateLimit.tappedOut();
    await this._manager.goto({
      url,
      waitForSelector: Selector.CARD,
    });

    await this._manager.page.click(Selector.COMMANDER);
    await this._manager.page.waitForSelector(Selector.COMMANDER_NAME, { visible: true });
    const element = await this._manager.page.$(Selector.COMMANDER_NAME);

    let name = await this._manager.getElementText(element);

    name = name.replace(/\s{2,}/g, "");
    name = name.replace(/\n/g, "");

    timerMessage.done();

    return { name, url };
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutBudget} budget
   * @param {string} hubs
   * @returns {Promise<{commander: string, price: number, links: Array<string>}>}
   * @private
   */
  async _buildSimilarLinks(commander, budget, hubs) {
    await super._init();

    const timerMessage = new TimerMessage(`finding similar links with ${budget.text}`);

    const maxPages = 5;
    const baseUrl = `${this._searchUrl}?q=&format=edh&general=${commander.queryString}&o=-rating&submit=Filter+results`;
    const links = [];
    let page = 1;

    while (page <= maxPages) {
      let searchUrl = `${baseUrl}&p=${page}&page=${page}`;

      if (budget.price > 0) {
        searchUrl += `&price_0=&price_1=${budget.price}`;
      } else {
        searchUrl += "&price_0=&price_1=";
      }

      if (hubs) {
        searchUrl += `&hubs=${hubs}`;
      }

      console.log("searching:", searchUrl);

      try {
        await RateLimit.tappedOut();
        await this._manager.goto({
          url: searchUrl,
          waitForSelector: Selector.DECK_LINK,
        });

        const elements = await this._manager.page.$$(Selector.DECK_LINK);

        for (const element of elements) {
          const href = await this._manager.getElementAttribute(element, "href");
          const link = `https://tappedout.net${href}`;
          links.push(link);
        }
      } catch (err) {
        console.log("unable to find links on page:", page);
      }

      page += 1;
    }

    timerMessage.done();

    return { commander: commander.queryString, price: budget.num, hubs, links };
  }

  /**
   * @returns {Promise<Array<string>>}
   * @private
   */
  async _buildHubs() {
    await super._init();

    const timerMessage = new TimerMessage("finding hubs on search page");

    await RateLimit.tappedOut();
    await this._manager.goto({
      url: this._searchUrl,
      waitForSelector: Selector.HUB,
    });

    const elements = await this._manager.page.$$(Selector.HUB);
    const list = [];

    for (const element of elements) {
      const value = await this._manager.getElementAttribute(element, "value");
      list.push(value);
    }

    timerMessage.done();

    return list;
  }

  /**
   * @param {string} url
   * @returns {Promise<{url: string, cards: Array<Card>}>}
   * @private
   */
  async _buildDeck(url) {
    await super._init();

    const timerMessage = new TimerMessage(`finding cards [ ${url} ]`);

    const cards = [];
    let retry = 0;

    while (retry < 4) {
      try {
        await RateLimit.tappedOut();
        await this._manager.goto({
          url,
          waitForSelector: Selector.CARD,
        });

        const parents = await this._manager.page.$$(Selector.CARD_LIST);
        const mainBoard = parents[0];
        const cardItems = await mainBoard.$$(Selector.MEMBER);

        for (const item of cardItems) {
          const card = await item.$(Selector.CARD);
          const amountString = await this._manager.getElementAttribute(card, "data-qty");
          let name = await this._manager.getElementAttribute(card, "data-name");
          const amount = parseInt(amountString, 10);

          const flip = await item.$$(Selector.CARD_LINK);

          if (flip.length > 1) {
            const flipLink = flip[1];
            const flipName = await this._manager.getElementAttribute(flipLink, "data-name");
            if (flipName) {
              name = `${name} // ${flipName}`;
            }
          }

          const cachedCard = await ScryfallCacheService.find(name);
          if (!cachedCard.id) continue;

          cards.push({ id: cachedCard.id, tappedOut: { amount } });
        }

        timerMessage.done();

        return { url, cards };
      } catch (err) {
        retry += 1;
        console.log("error while trying to find deck on tapped out. retrying:", retry);
        console.error(err);
      }
    }
  }

  /**
   * @param {TappedOutAccount} account
   * @returns {Promise<void>}
   * @private
   */
  async _login(account) {
    if (this._loggedIn) return;

    await super._init();

    const timerMessage = new TimerMessage("login");

    await RateLimit.tappedOut();
    await this._manager.goto({
      url: "https://tappedout.net/accounts/login/?next=/",
      waitForSelector: Selector.USERNAME,
    });
    await this._manager.page.type(Selector.USERNAME, account.username);
    await this._manager.page.type(Selector.PASSWORD, account.password);
    await this._manager.page.click(Selector.SUBMIT);
    await this._manager.page.waitForSelector(Selector.LOGGED_IN, { visible: true });

    timerMessage.done();

    this._loggedIn = true;
  }

  destroy() {
    this._manager.destroy();
  }
}

const service = new TappedOutService();

export default service;
