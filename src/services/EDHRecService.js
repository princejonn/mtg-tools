import { includes } from "lodash";
import EDHRecThemeList from "models/EDHRecThemeList";
import EDHRecRecommendation from "models/EDHRecRecommendation";
import CacheTimeout from "utils/CacheTimeout";
import PuppeteerManager from "utils/PuppeteerManager";
import RateLimit from "utils/RateLimit";
import NeDB, { Collection } from "../utils/NeDB";

const Selector = {
  CARD_ELEMENT: "div#cardlists div.nw",
  CARD_NAME: "div.nwname",
  CARD_DESC: "div.nwdesc",
};

export default class EDHRecService {
  /**
   * @param {Commander} commander
   * @returns {Promise<EDHRecThemeList>}
   */
  static async getThemeList(commander) {
    const timeout = new CacheTimeout({ days: 14 });
    const db = new NeDB(Collection.THEMES);

    const cached = await db.find({ commander: commander.url });

    if (cached && timeout.isOK(cached.created)) {
      return new EDHRecThemeList(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found themes in database with expired timeout:", commander.url);
      await db.remove({ commander: commander.url });
    }

    console.log("searching for themes on edhrec:", commander.url);

    const manager = new PuppeteerManager();
    await manager.init();
    const data = await EDHRecService._buildThemes(manager, commander);
    manager.destroy();

    await db.insert(data);

    return new EDHRecThemeList(data);
  }

  /**
   * @param {EDHRecTheme} theme
   * @returns {Promise<EDHRecRecommendation>}
   */
  static async getRecommendation(theme) {
    const timeout = new CacheTimeout({ days: 14 });
    const db = new NeDB(Collection.RECOMMENDATIONS);

    const cached = await db.find({ url: theme.url });

    if (cached && timeout.isOK(cached.created)) {
      return new EDHRecRecommendation(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found commander recommendation in database with expired timeout:", theme.url);
      await db.remove({ url: theme.url });
    }

    console.log("searching for commander recommendation on edhrec:", theme.url);

    const manager = new PuppeteerManager();
    await manager.init();
    const data = await EDHRecService._buildRecommendation(manager, theme);
    manager.destroy();

    await db.insert(data);

    return new EDHRecRecommendation(data);
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {Commander} commander
   * @returns {Promise<{commander: string, themes: Array<{theme: string, link: string, type: string}>}>}
   * @private
   */
  static async _buildThemes(manager, commander) {
    const themes = [];

    const themeSelector = `a[href^="${commander.queryString}-"]`;
    const commanderUrl = `https://edhrec.com/commanders/${commander.queryString}`;

    await RateLimit.edhRec();
    await manager.goto({
      url: commanderUrl,
      waitForSelector: themeSelector,
    });

    let num = 0;
    themes.push({ theme: "no theme/budget", url: commanderUrl, type: "none", num });

    const elements = await manager.page.$$(themeSelector);
    for (const element of elements) {
      const href = await manager.getElementAttribute(element, "href");

      let theme = await manager.getElementText(element);
      theme = theme.replace(/\s{2,}/g, "");
      theme = theme.replace(/\n/g, "");

      const object = {
        theme,
        url: `https://edhrec.com/commanders/${href}`,
      };

      const type = includes(href, "budget")
        ? "budget"
        : "theme";

      num += 1;

      themes.push({ ...object, type, num });
    }

    return { commander: commander.url, themes };
  }

  /**
   * @param {PuppeteerManager} manager
   * @param {EDHRecTheme} theme
   * @returns {Promise<{url: string, cards: Array<Card>}>}
   * @private
   */
  static async _buildRecommendation(manager, theme) {
    const cards = [];

    const regexDecksPercent = /(\d+\%.*of)/;
    const regexDecksNumber = /(of.*)(\d+)(.*decks)/;
    const regexSynergy = /(\+|\-)(\d+)(\%.*synergy)/;
    const numbers = /\d+\.?\d*/;

    await RateLimit.edhRec();
    await manager.goto({
      url: theme.url,
      waitForSelector: Selector.CARD_ELEMENT,
    });

    const elements = await manager.page.$$(Selector.CARD_ELEMENT);
    for (const element of elements) {
      const nameElement = await element.$(Selector.CARD_NAME);
      const descElement = await element.$(Selector.CARD_DESC);

      const name = await manager.getElementText(nameElement);
      const desc = await manager.getElementText(descElement);

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

      cards.push({ name, edhRec: { amount, percent, synergy } });
    }

    return { url: theme.url, cards };
  }
}
