import _ from "lodash";
import logger from "logger";
import Card from "objects/Card";
import BasePage from "pages/BasePage";
import ElementAttribute from "enums/ElementAttribute";
import Selector from "enums/Selector";
import DomainTypeError from "errors/DomainTypeError";

export default class TappedOut extends BasePage {
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  async login(username, password) {
    if (!_.isString(username)) {
      throw new DomainTypeError({ username });
    }
    if (!_.isString(password)) {
      throw new DomainTypeError({ password });
    }

    logger.debug("logging in with username", username);

    await this.goto({
      url: "https://tappedout.net/accounts/login/?next=/",
      waitForSelector: "input#id_username",
    });

    await this.page.type("input#id_username", username);
    await this.page.type("input#id_password", password);
    await this.page.click("input.submit");

    await this.page.waitForSelector("div.tabbable ul.nav li.active", { visible: true });
  }

  async getCommanderQueryString() {
    logger.debug("returning commander query string from commander card on page");

    const element = await this.page.$(Selector.TappedOut.COMMANDER);
    const url = await this.getElementAttribute(element, ElementAttribute.HREF);

    const split = url.split("/mtg-card/");
    const name = split[1].slice(0, -1);

    return name;
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getCards() {
    logger.debug("returning cards from Main Board on page");

    const cards = [];

    await this.page.waitForSelector(Selector.TappedOut.CARD);

    const parents = await this.page.$$(Selector.TappedOut.CARD_LISTS);
    const mainBoard = parents[0];
    const elements = await mainBoard.$$(Selector.TappedOut.CARD);

    for (const element of elements) {
      const name = await this.getElementAttribute(element, ElementAttribute.DATA_NAME);
      const image = await this.getElementAttribute(element, ElementAttribute.DATA_IMAGE);

      const card = new Card(name, image);

      card.addAmount();
      card.setTappedOut();

      cards.push(card);
    }

    return cards;
  }

  /**
   * @param {string} commanderQueryString
   * @returns {Promise<Array<string>>}
   */
  async getSimilarDeckLinks(commanderQueryString) {
    logger.debug("getting similar deck links");

    await this.goto({
      url: `https://tappedout.net/mtg-decks/search/?q=&format=edh&general=${commanderQueryString}&price_0=&price_1=&o=-rating&submit=Filter+results`,
      waitForSelector: Selector.TappedOut.Pagination.ACTIVE,
    });

    const paginationList = await this._getPaginationLinks();
    const deckList = [];

    for (const url of paginationList) {
      const array = await this._getDeckLinks(url);
      deckList.concat(array);
    }

    return deckList;
  }

  /**
   * @returns {Promise<Array<string>>}
   * @private
   */
  async _getPaginationLinks() {
    logger.debug("getting first three pagination links on search page if they exist");

    const array = [];

    const elements = await this.page.$$(Selector.TappedOut.Pagination.LINK);

    for (const element of elements) {
      if (array.length >= 3) continue;

      const url = await this.getElementAttribute(element, ElementAttribute.HREF);

      if (
        _.includes(url, "&p=1&page=1") ||
        _.includes(url, "&p=2&page=2") ||
        _.includes(url, "&p=3&page=3")
      ) {
        array.push(`https://tappedout.net/mtg-decks/search/${url}`);
      }
    }

    return array;
  }

  /**
   * @param {string} url
   * @returns {Promise<Array<string>>}
   * @private
   */
  async _getDeckLinks(url) {
    logger.debug("getting deck links on search page");

    const array = [];

    await this.goto({
      url,
      waitForSelector: Selector.TappedOut.Pagination.ACTIVE,
    });

    const deckLinks = await this.page.$$(Selector.TappedOut.Search.DECK_LINK);

    for (const element of deckLinks) {
      const deckLinkUrl = await this.getElementAttribute(element, ElementAttribute.HREF);
      array.push(`https://tappedout.net${deckLinkUrl}`);
    }

    return array;
  }
}
