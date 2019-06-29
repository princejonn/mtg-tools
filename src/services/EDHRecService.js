import includes from "lodash/includes";
import EDHRecRecommendation from "models/EDHRecRecommendation";
import ScryfallCacheService from "services/ScryfallService";
import BasePage from "utils/BasePage";
import CacheTimeout from "utils/CacheTimeout";
import RateLimit from "utils/RateLimit";
import NeDB, { Collection } from "utils/NeDB";
import TimerMessage from "utils/TimerMessage";

const Selector = {
  CARD_ELEMENT: "div#cardlists div.nw",
  CARD_NAME: "div.nwname",
  CARD_DESC: "div.nwdesc",
};

class EDHRecService extends BasePage {
  constructor() {
    super();
    this._themes = new NeDB(Collection.THEMES);
    this._recommendations = new NeDB(Collection.RECOMMENDATIONS);
  }

  /**
   * @param {Commander} commander
   * @returns {Promise<Array<{type: string, text: string, url: string}>>}
   */
  async getThemeList(commander) {
    const timeout = new CacheTimeout({ days: 14 });
    const cached = await this._themes.find({ commander: commander.queryString });

    if (cached && timeout.isOK(cached.created)) {
      return cached.themes;
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found themes in database with expired timeout:", commander.queryString);
      await this._themes.remove({ commander: commander.queryString });
    }

    console.log("searching for themes on edhrec:", commander.queryString);
    const data = await this._buildThemes(commander);
    await this._themes.insert({
      commander: commander.queryString,
      themes: data,
    });

    return data;
  }

  /**
   * @param {EDHRecTheme} theme
   * @returns {Promise<EDHRecRecommendation>}
   */
  async getRecommendation(theme) {
    const timeout = new CacheTimeout({ days: 14 });
    const cached = await this._recommendations.find({ url: theme.url });

    if (cached && timeout.isOK(cached.created)) {
      return new EDHRecRecommendation(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found commander recommendation in database with expired timeout:", theme.url);
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
    await super._init();

    const timerMessage = new TimerMessage("finding themes");

    const themes = [];

    const themeSelector = `a[href^="${commander.queryString}-"]`;
    const commanderUrl = `https://edhrec.com/commanders/${commander.queryString}`;

    await RateLimit.edhRec();
    await this._manager.goto({
      url: commanderUrl,
      waitForSelector: themeSelector,
    });

    let num = 0;
    themes.push({ text: "no theme/budget", url: commanderUrl, type: "none", num });

    const elements = await this._manager.page.$$(themeSelector);
    for (const element of elements) {
      const href = await this._manager.getElementAttribute(element, "href");

      let text = await this._manager.getElementText(element);
      text = text.replace(/\s{2,}/g, "");
      text = text.replace(/\n/g, "");

      const object = {
        text,
        url: `https://edhrec.com/commanders/${href}`,
      };

      const type = includes(href, "budget")
        ? "budget"
        : "theme";

      num += 1;

      themes.push({ ...object, type, num });
    }

    timerMessage.done();

    return themes;
  }

  /**
   * @param {EDHRecTheme} theme
   * @returns {Promise<{url: string, cards: Array<Card>}>}
   * @private
   */
  async _buildRecommendation(theme) {
    await super._init();

    const timerMessage = new TimerMessage("finding recommendation");

    const cards = [];

    const regexDecksPercent = /(\d+\%.*of)/;
    const regexDecksNumber = /(of.*)(\d+)(.*decks)/;
    const regexSynergy = /(\+|\-)(\d+)(\%.*synergy)/;
    const numbers = /\d+\.?\d*/;

    await RateLimit.edhRec();
    await this._manager.goto({
      url: theme.url,
      waitForSelector: Selector.CARD_ELEMENT,
    });

    const elements = await this._manager.page.$$(Selector.CARD_ELEMENT);
    for (const element of elements) {
      const nameElement = await element.$(Selector.CARD_NAME);
      const name = await this._manager.getElementText(nameElement);

      const card = await ScryfallCacheService.find(name);
      if (!card.id) continue;

      const descElement = await element.$(Selector.CARD_DESC);
      const desc = await this._manager.getElementText(descElement);

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
      const percent = inPercentOfDecksDigits;

      cards.push({ id: card.id, edhRec: { amount, percent, synergy } });
    }

    timerMessage.done();

    return { url: theme.url, cards };
  }

  destroy() {
    this._manager.destroy();
  }
}

const service = new EDHRecService();

export default service;
