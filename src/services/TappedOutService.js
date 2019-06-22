import uuidv4 from "uuid/v4";
import logger from "logger";
import PuppeteerManager from "utils/PuppeteerManager";
import Commander from "models/Commander";
import TappedOutAccount from "models/TappedOutAccount";
import TappedOutDeck from "models/TappedOutDeck";
import TappedOutLinkList from "models/TappedOutLinkList";
import ScryfallService from "services/ScryfallService";
import CacheTimeout from "utils/CacheTimeout";
import LowDB, { Table } from "utils/LowDB";
import RateLimit from "utils/RateLimit";

const Selector = {
  USERNAME: "input#id_username",
  PASSWORD: "input#id_password",
  SUBMIT: "input.submit",
  LOGGED_IN: "div.tabbable ul.nav li.active",
  COMMANDER: "ul.boardlist > a",
  COMMANDER_NAME: ".well-jumbotron h1",
  DECK_LINK: "h3.deck-wide-header a",
  CARD_LIST: "div.well div.board-container",
  MEMBER: "ul.boardlist > li.member",
  CARD: "a.board",
  CARD_LINK: "span > a",
};

export default class TappedOutService {
  /**
   * @param {string} url
   * @param {TappedOutAccount} account
   * @returns {Promise<Commander>}
   */
  static async getCommander(url, account) {
    const timeout = new CacheTimeout({ years: 1 });
    const db = new LowDB(Table.TAPPED_OUT_COMMANDERS);

    const cached = db.find({ url });

    if (cached && timeout.isOK(cached.created)) {
      return new Commander(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found commander in database with expired timeout", url);
      db.remove(cached.id);
    }

    logger.debug("searching for commander on tapped out", url);

    const manager = new PuppeteerManager();
    await manager.init();
    const data = await TappedOutService._buildCommander(manager, url, account);
    db.push(data);
    manager.destroy();

    return new Commander(data);
  }

  /**
   * @param {Commander} commander
   * @param {TappedOutAccount} account
   * @returns {Promise<TappedOutDeck>}
   */
  static async getCommanderDeck(commander, account) {
    const manager = new PuppeteerManager();
    await manager.init();
    await TappedOutService._login(manager, account);
    const data = await TappedOutService._buildDeck(manager, commander.url);
    manager.destroy();

    return new TappedOutDeck(data);
  }

  /**
   * @param {Commander} commander
   * @returns {Promise<TappedOutLinkList>}
   */
  static async getSimilarLinks(commander) {
    const timeout = new CacheTimeout({ days: 7 });
    const db = new LowDB(Table.TAPPED_OUT_LINKS);

    const cached = db.find({ commander: commander.name });

    if (cached && timeout.isOK(cached.created)) {
      return new TappedOutLinkList(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found links in database with expired timeout", commander.name);
      db.remove(cached.id);
    }

    logger.debug("searching for links on tapped out", commander.name);

    const manager = new PuppeteerManager();
    await manager.init();
    const data = await TappedOutService._buildSimilarLinks(manager, commander);
    db.push(data);

    return new TappedOutLinkList(data);
  }

  /**
   * @param {string} url
   * @returns {Promise<TappedOutDeck>}
   */
  static async getDeck(url) {
    const timeout = new CacheTimeout({ days: 7 });
    const db = new LowDB(Table.TAPPED_OUT_DECKS);

    const cached = db.find({ url });

    if (cached && timeout.isOK(cached.created)) {
      const deck = await TappedOutService._buildDeckFromCached(cached);
      return new TappedOutDeck(deck);
    } else if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found deck in database with expired timeout", url);
      db.remove(cached.id);
    }

    logger.debug("searching for deck on tapped out", url);

    const manager = new PuppeteerManager();
    await manager.init();
    const data = await TappedOutService._buildDeck(manager, url);
    await TappedOutService._saveDeckToDb(db, data);
    manager.destroy();

    return new TappedOutDeck(data);
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {string} url
   * @param {TappedOutAccount} account
   * @returns {Promise<{id: string, url: string, name: string, queryString: string}>}
   * @private
   */
  static async _buildCommander(manager, url, account) {
    logger.debug("finding commander");

    const uuid = uuidv4();
    await TappedOutService._login(manager, account);

    await manager.goto({
      url,
      waitForSelector: Selector.CARD,
    });

    await manager.page.click(Selector.COMMANDER);
    await manager.page.waitForSelector(Selector.COMMANDER_NAME, { visible: true });
    const element = await manager.page.$(Selector.COMMANDER_NAME);

    let name = await manager.getElementText(element);

    name = name.replace(/\s{2,}/g, "");
    name = name.replace(/\n/g, "");

    const queryString = name
      .replace(/\s/g, "-")
      .replace(/\'/g, "")
      .replace(/\,/g, "")
      .toLowerCase();

    return { id: uuid, name, url, queryString };
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {Commander} commander
   * @returns {Promise<{id: string, links: Array<string>}>}
   * @private
   */
  static async _buildSimilarLinks(manager, commander) {
    logger.debug("finding similar links");

    const uuid = uuidv4();
    const baseUrl = `https://tappedout.net/mtg-decks/search/?q=&format=edh&general=${commander.queryString}&price_0=&price_1=&o=-rating&submit=Filter+results`
    const pages = [ 1, 2, 3, 4, 5 ];
    const links = [];

    for (const number of pages) {
      const searchUrl = `${baseUrl}&p=${number}&page=${number}`;
      await RateLimit.tappedOut();
      await manager.goto({
        url: searchUrl,
        waitForSelector: Selector.DECK_LINK,
      });

      const elements = await manager.page.$$(Selector.DECK_LINK);

      for (const element of elements) {
        const href = await manager.getElementAttribute(element, "href");
        const link = `https://tappedout.net${href}`;
        logger.debug("found similar link", link);
        links.push(link);
      }
    }

    await manager.destroy();

    return { id: uuid, commander: commander.name, links };
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {string} url
   * @returns {Promise<{id: string, url: string, cards: Array<Card>}>}
   * @private
   */
  static async _buildDeck(manager, url) {
    logger.debug("finding cards");

    const uuid = uuidv4();
    const array = [];
    const cards = [];

    await RateLimit.tappedOut();
    await manager.goto({
      url,
      waitForSelector: Selector.CARD,
    });

    const parents = await manager.page.$$(Selector.CARD_LIST);
    const mainBoard = parents[0];
    const members = await mainBoard.$$(Selector.MEMBER);

    for (const member of members) {
      const cardElement = await member.$(Selector.CARD);
      let name = await manager.getElementAttribute(cardElement, "data-name");
      let amount = await manager.getElementAttribute(cardElement, "data-qty");
      amount = parseInt(amount, 10);

      const flip = await member.$$(Selector.CARD_LINK);

      if (flip.length > 1) {
        const flipLink = flip[1];
        const flipName = await manager.getElementAttribute(flipLink, "data-name");
        name = `${name} // ${flipName}`;
      }

      array.push({ name, tappedOut: { amount } });
    }

    for (const item of array) {
      const { name, tappedOut } = item;
      const card = await ScryfallService.findCard(name);
      if (!card) continue;
      card.setTappedOut(tappedOut);
      cards.push(card);
    }
    return { id: uuid, url, cards };
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {TappedOutAccount} account
   * @returns {Promise<void>}
   * @private
   */
  static async _login(manager, account) {
    logger.debug("logging in to user account");
    await manager.goto({
      url: "https://tappedout.net/accounts/login/?next=/",
      waitForSelector: Selector.USERNAME,
    });
    await manager.page.type(Selector.USERNAME, account.username);
    await manager.page.type(Selector.PASSWORD, account.password);
    await manager.page.click(Selector.SUBMIT);
    logger.debug("verifying if login was successful");
    await manager.page.waitForSelector(Selector.LOGGED_IN, { visible: true });
  }

  /**
   * @param {LowDB} db
   * @param {{id: string, url: string, cards: Array<Card>}} data
   * @returns {Promise<void>}
   * @private
   */
  static async _saveDeckToDb(db, data) {
    const { id, url } = data;
    const cards = [];

    for (const card of data.cards) {
      const { id, tappedOut } = card;
      cards.push({ id, tappedOut });
    }

    db.push({ id, url, cards });
  }

  /**
   * @param {{id: string, url: string, cards: Array<{id: string, tappedOut: object}>}} data
   * @returns {Promise<{id: string, url: string, cards: Array<Card>}>}
   * @private
   */
  static async _buildDeckFromCached(data) {
    const { id, url } = data;
    const cards = [];

    for (const item of data.cards) {
      const { id, tappedOut } = item;
      const card = await ScryfallService.getCard(id);
      if (!card) continue;
      card.setTappedOut(tappedOut);
      cards.push(card);
    }

    return { id, url, cards };
  }
}
