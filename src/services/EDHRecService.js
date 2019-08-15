import includes from "lodash/includes";
import EDHRecRecommendation from "models/EDHRecRecommendation";
import ScryfallCacheService from "services/ScryfallService";
import BasePage from "utils/BasePage";
import CacheTimeout from "utils/CacheTimeout";
import RateLimit from "utils/RateLimit";
import NeDB, { Collection } from "utils/NeDB";
import Spinners from "utils/Spinners";
import Logger from "utils/Logger";

const Selector = {
  CARD_ELEMENT: "div#cardlists div.nw",
  CARD_NAME: "div.nwname",
  CARD_DESC: "div.nwdesc",
};

class EDHRecService extends BasePage {
  constructor() {
    super();
    this._logger = Logger.getContextLogger("edhrec-service");
    this._themes = new NeDB(Collection.THEMES);
    this._recommendations = new NeDB(Collection.RECOMMENDATIONS);
  }

  /**
   * @param {Commander} commander
   * @returns {Promise<Array<{type: string, text: string, url: string}>>}
   */
  async getThemeList(commander) {
    this._logger.debug("getting theme list for commander", commander);

    const timeout = new CacheTimeout({ days: 14 });
    const cached = await this._themes.find({ commander: commander.queryString });

    if (cached && timeout.isOK(cached.created)) {
      return cached.themes;
    } if (cached && !timeout.isOK(cached.created)) {
      await this._themes.remove({ commander: commander.queryString });
    }

    Spinners.next("fetching themes");
    const data = await this._buildThemes(commander);
    await this._themes.insert({
      commander: commander.queryString,
      themes: data,
    });
    Spinners.succeed();

    return data;
  }

  /**
   * @param {EDHRecTheme} theme
   * @returns {Promise<EDHRecRecommendation>}
   */
  async getRecommendation(theme) {
    this._logger.debug("getting recommendation for commander with theme", theme);

    const timeout = new CacheTimeout({ days: 14 });
    const cached = await this._recommendations.find({ url: theme.url });

    if (cached && timeout.isOK(cached.created)) {
      return new EDHRecRecommendation(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      await this._recommendations.remove({ url: theme.url });
    }

    const data = await this._buildRecommendation(theme);
    await this._recommendations.insert(data);

    return new EDHRecRecommendation(data);
  }

  /**
   * @param {Commander} commander
   * @returns {Promise<Array<{type: string, text: string, url: string}>>}
   * @private
   */
  async _buildThemes(commander) {
    this._logger.debug("building themes for commander", commander);

    await super._init();

    const themes = [];

    const themeSelector = `a[href^="${commander.queryString}-"]`;
    const commanderUrl = `https://edhrec.com/commanders/${commander.queryString}`;

    await RateLimit.edhRec();
    await super.goto({
      url: commanderUrl,
      waitForSelector: themeSelector,
    });

    let num = 0;

    themes.push({
      text: "no theme/budget",
      url: commanderUrl,
      type: "none",
      num,
    });

    const elements = await super.findAll(themeSelector);

    this._logger.debug("found # elements", elements.length);

    for (const element of elements) {
      const href = await super.getAttribute(element, "href");

      let text = await super.getText(element);
      text = text.replace(/\s{2,}/g, "");
      text = text.replace(/\n/g, "");

      const object = {
        text,
        url: `https://edhrec.com/commanders/${href}`,
      };

      const type = includes(href, "budget") ? "budget" : "theme";

      num += 1;

      themes.push({ ...object, type, num });
    }

    return themes;
  }

  /**
   * @param {EDHRecTheme} theme
   * @returns {Promise<{url: string, cards: Array<Card>}>}
   * @private
   */
  async _buildRecommendation(theme) {
    this._logger.debug("building recommendation for commander with theme", theme);

    await super._init();

    const cards = [];

    const regexDecksPercent = /(\d+\%.*of)/;
    const regexDecksNumber = /(of.*)(\d+)(.*decks)/;
    const regexSynergy = /(\+|\-)(\d+)(\%.*synergy)/;
    const numbers = /\d+\.?\d*/;

    await RateLimit.edhRec();
    await super.goto({
      url: theme.url,
      waitForSelector: Selector.CARD_ELEMENT,
    });

    const elements = await super.findAll(Selector.CARD_ELEMENT);

    this._logger.debug("found # elements", elements.length);

    for (const element of elements) {
      const nameElement = await element.$(Selector.CARD_NAME);
      const name = await super.getText(nameElement);

      const card = await ScryfallCacheService.find(name);
      if (!card.id) continue;

      const descElement = await element.$(Selector.CARD_DESC);
      const desc = await super.getText(descElement);

      const inPercentOfDecks = desc.match(regexDecksPercent)[0];
      const inPercentOfDecksDigits = parseInt(inPercentOfDecks.match(numbers)[0], 10);
      const inPercentOfDecksFloat = parseFloat(`0.${inPercentOfDecksDigits}`);

      const inAmountOfDecks = desc.match(regexDecksNumber)[0].match(numbers)[0];
      const inAmountOfDecksDigits = inAmountOfDecks.match(numbers)[0];
      const inAmountOfDecksFloat = parseFloat(inAmountOfDecksDigits);

      const plusMinusSynergy = desc.match(regexSynergy)[1];

      const synergyInDecks = desc.match(regexSynergy)[0];
      const synergyInDecksDigits = synergyInDecks.match(numbers)[0];

      const amount = Math.floor(inAmountOfDecksFloat * inPercentOfDecksFloat);
      const synergy = parseFloat(`${plusMinusSynergy}${synergyInDecksDigits}`);

      cards.push({
        id: card.id,
        edhRec: {
          amount,
          percent: inPercentOfDecksDigits,
          synergy,
        },
      });
    }

    return {
      url: theme.url,
      cards,
    };
  }

  destroy() {
    this._manager.destroy();
  }
}

const service = new EDHRecService();

export default service;
