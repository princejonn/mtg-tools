import _ from "lodash";
import logger from "logger";
import Card from "objects/Card";
import BasePage from "pages/BasePage";
import ElementAttribute from "enums/ElementAttribute";
import Selector from "enums/Selector";
import DomainTypeError from "errors/DomainTypeError";
import RateLimit from "components/RateLimit";

export default class TappedOut extends BasePage {
  constructor(page) {
    super(page);

    this.commanderQueryString = null;
  }

  /**
   * @param {string} url
   * @param {string} waitForSelector
   * @returns {Promise<void>}
   */
  async goto({ url, waitForSelector }) {
    logger.debug(`goto [ ${url} ]`);
    await RateLimit.tappedOut();
    await super.goto({ url, waitForSelector });
  }

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

    await this.goto({
      url: "https://tappedout.net/accounts/login/?next=/",
      waitForSelector: "input#id_username",
    });

    await this.page.type("input#id_username", username);
    await this.page.type("input#id_password", password);
    await this.page.click("input.submit");

    await this.page.waitForSelector("div.tabbable ul.nav li.active", { visible: true });
  }

  async setCommanderQueryString() {
    const element = await this.page.$(Selector.TappedOut.COMMANDER);
    const url = await this.getElementAttribute(element, ElementAttribute.HREF);
    const split = url.split("/mtg-card/");
    this.commanderQueryString = split[1].slice(0, -1);
    logger.debug(`commander query string [ ${this.commanderQueryString} ]`);
  }

  async getCommanderQueryString() {
    return this.commanderQueryString;
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getCards() {
    const cards = [];

    try {
      await this.page.waitForSelector(Selector.TappedOut.CARD);

      const parents = await this.page.$$(Selector.TappedOut.CARD_LISTS);
      const mainBoard = parents[0];
      const elements = await mainBoard.$$(Selector.TappedOut.CARD);

      for (const element of elements) {
        const name = await this.getElementAttribute(element, ElementAttribute.DATA_NAME);
        const image = await this.getElementAttribute(element, ElementAttribute.DATA_IMAGE);

        const card = new Card(name, image);

        card.setTappedOut();
        card.addTappedOutAmount();

        logger.silly("adding TappedOut card", card.name);

        cards.push(card);
      }
    } catch (err) {
      logger.error(err);
    }

    logger.debug(`found [ ${cards.length} ] TappedOut cards`);
    return cards;
  }

  /**
   * @returns {Promise<Array<string>>}
   */
  async getSimilarDeckLinks() {
    const pageNumbers = [ 1, 2, 3 ];
    const array = [];

    for (const pageNumber of pageNumbers) {
      const url = `https://tappedout.net/mtg-decks/search/?q=&format=edh&general=${this.commanderQueryString}&price_0=&price_1=&o=-rating&submit=Filter+results&p=${pageNumber}&page=${pageNumber}`;

      logger.debug(`getting deck links [ ${url} ]`);

      await this.goto({
        url,
        waitForSelector: Selector.TappedOut.Pagination.ACTIVE,
      });

      const elements = await this.page.$$(Selector.TappedOut.Search.DECK_LINK);

      for (const element of elements) {
        const deckLinkUrl = await this.getElementAttribute(element, ElementAttribute.HREF);
        const completeUrl = `https://tappedout.net${deckLinkUrl}`;

        logger.debug(`deck link [ ${completeUrl} ]`);

        array.push(completeUrl);
      }
    }
    return array;
  }
}
