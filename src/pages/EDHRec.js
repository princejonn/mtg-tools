import readline from "readline";
import { includes, isNumber, isString } from "lodash";
import logger from "logger";
import BasePage from "pages/BasePage";
import Card from "objects/Card";
import ElementAttribute from "enums/ElementAttribute";
import Selector from "enums/Selector";
import DomainTypeError from "errors/DomainTypeError";
import RateLimit from "components/RateLimit";

export default class EDHRec extends BasePage {
  /**
   * @param {object} page
   * @param {string} commanderQueryString
   */
  constructor(page, commanderQueryString) {
    super(page);

    if (!isString(commanderQueryString)) {
      throw new DomainTypeError({ commanderQueryString });
    }

    this.commanderQueryString = commanderQueryString;
    this.url = `https://edhrec.com/commanders/${this.commanderQueryString}`;
    this.themeSelector = `a[href^="${this.commanderQueryString}-"]`;
  }

  /**
   * @returns {Promise<void>}
   */
  async goto() {
    await RateLimit.edhRec();
    await super.goto({
      url: this.url,
      waitForSelector: Selector.EdhRec.Card.ELEMENT,
    });
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getSuggestedCards() {
    const array = [];

    const regexDecksPercent = /(\d+\%.*of)/;
    const regexDecksNumber = /(of.*)(\d+)(.*decks)/;
    const regexSynergy = /(\+|\-)(\d+)(\%.*synergy)/;
    const numbers = /\d+\.?\d*/;

    await this.page.waitForSelector(Selector.EdhRec.Card.ELEMENT);
    const cards = await this.page.$$(Selector.EdhRec.Card.ELEMENT);

    for (const element of cards) {
      const nameElement = await element.$(Selector.EdhRec.Card.NAME);
      const descElement = await element.$(Selector.EdhRec.Card.DESC);
      const imageElement = await element.$(Selector.EdhRec.Card.IMAGE);

      const name = await this.getElementText(nameElement);
      const desc = await this.getElementText(descElement);
      const image = await this.getElementAttribute(imageElement, ElementAttribute.DATA_SRC);

      const inPercentOfDecks = desc.match(regexDecksPercent)[0];
      const inPercentOfDecksDigits = inPercentOfDecks.match(numbers)[0];
      const inPercentOfDecksFloat = parseFloat(`0.${inPercentOfDecksDigits}`);

      const inAmountOfDecks = desc.match(regexDecksNumber)[0].match(numbers)[0];
      const inAmountOfDecksDigits = inAmountOfDecks.match(numbers)[0];
      const inAmountOfDecksFloat = parseFloat(inAmountOfDecksDigits);

      const plusMinusSynergy = desc.match(regexSynergy)[1];

      const synergyInDecks = desc.match(regexSynergy)[0];
      const synergyInDecksDigits = synergyInDecks.match(numbers)[0];

      const synergy = parseFloat(`${plusMinusSynergy}${synergyInDecksDigits}`);

      const amount = Math.floor(inAmountOfDecksFloat * inPercentOfDecksFloat);

      const card = new Card(name, image);

      card.setEDHRec();
      card.setEDHRecAmount(amount);
      card.setEDHRecSynergy(synergy);

      logger.silly("adding EDHRec card", card.name);

      array.push(card);
    }

    logger.debug(`found [ ${array.length} ] EDHRec cards`);

    return array;
  }

  /**
   * @returns {Promise<void>}
   */
  async selectThemeAndBudget() {
    const themeArray = [];
    const budgetArray = [];

    await this.page.waitForSelector(this.themeSelector);
    const elements = await this.page.$$(this.themeSelector);

    for (const element of elements) {
      const href = await this.getElementAttribute(element, ElementAttribute.HREF);
      let text = await this.getElementText(element);
      text = text.replace(/\s{2,}/g, "");
      text = text.replace(/\n/g, "");

      if (includes(href, "budget")) {
        budgetArray.push({ text, element });
      } else {
        themeArray.push({ text, element });
      }
    }

    await this.selectThemeDialog(themeArray);
    await this.selectBudgetDialog(budgetArray);
  }

  /**
   * @param {Array<object>} array
   * @returns {Promise<number>}
   */
  async selectThemeDialog(array) {
    const allowedAnswers = [ 0 ];

    let question = "Select one theme if you want:\n";
    let num = 1;
    for (const obj of array) {
      allowedAnswers.push(num);
      question += `  ${num}: ${obj.text}\n`;
      num += 1;
    }
    question += "  0: no theme\n";

    const answer = await this._readLineMenu(question, allowedAnswers);
    await this._clickAnsweredElement(array, answer);
  }

  /**
   * @param {Array<string>} array
   * @returns {Promise<number>}
   */
  async selectBudgetDialog(array) {
    const allowedAnswers = [ 0 ];

    let question = "Select a budget if you want:\n";
    let num = 1;
    for (const obj of array) {
      allowedAnswers.push(num);
      question += `  ${num}: ${obj.text}\n`;
      num += 1;
    }
    question += "  0: no budget\n";

    const answer = await this._readLineMenu(question, allowedAnswers);
    await this._clickAnsweredElement(array, answer);
  }

  /**
   * @param {Array<object>} array
   * @param {number} answer
   * @returns {Promise<void>}
   * @private
   */
  async _clickAnsweredElement(array, answer) {
    console.log(" ");
    if (answer === 0) return;

    const clickObject = array[answer - 1];
    await clickObject.element.click();
    await this.page.waitForSelector(Selector.EdhRec.Card.ELEMENT);
  }

  /**
   * @param {string} question
   * @param {Array<number>} allowedAnswers
   * @returns {Promise<number>}
   * @private
   */
  async _readLineMenu(question, allowedAnswers) {
    while (true) {
      const answer = await this._readLine(question);
      const number = parseInt(answer, 10);

      if (!isNumber(number)) continue;
      if (!includes(allowedAnswers, number)) continue;

      return number;
    }
  }

  /**
   * @param {string} question
   * @returns {Promise<string>}
   * @private
   */
  async _readLine(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => rl.question(`${question}\nAnswer: `, answer => {
      rl.close();
      resolve(answer);
    }));
  }
}
