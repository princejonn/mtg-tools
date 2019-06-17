import fs from "fs";
import path from "path";
import dateFns from "date-fns";
import { isString, isFunction } from "lodash";
import logger from "logger";
import DomainTypeError from "errors/DomainTypeError";

export default class Reporter {
  /**
   * @param {string} commanderQueryString
   * @param {DeckList} deckList
   */
  constructor(commanderQueryString, deckList) {
    if (!isString(commanderQueryString)) {
      throw new DomainTypeError({ commanderQueryString });
    }
    if (!isFunction(deckList.join)) {
      throw new DomainTypeError({ deckList });
    }

    this.commander = commanderQueryString;
    this.deckList = deckList;
    this.pwd = process.env.PWD;
    this.now = dateFns.format(new Date(), "YYYY-MM-DDTHH_mm_ss");
    this.cwd = path.join(this.pwd, "reports");

    if (!fs.existsSync(this.cwd)) {
      fs.mkdirSync(this.cwd);
    }
  }

  createTxt() {
    const amount = 20;
    const file = path.join(this.cwd, `${this.commander}-${this.now}.txt`);

    const addTheseCards = this.deckList.getCardsNotInDeckByMostUsage();
    const removeTheseCards = this.deckList.getCardsInDeckByLeastUsage();

    fs.appendFileSync(file, "\r\nCONSIDER ADDING THESE CARDS TO YOUR DECK\r\n\r\n");

    for (let i = 0; i < amount; i++) {
      const card = addTheseCards[i];
      fs.appendFileSync(file, card.getTxt());
    }

    fs.appendFileSync(file, "\r\n\r\nCONSIDER REMOVING THESE CARDS FROM YOUR DECK\r\n\r\n");

    for (let i = 0; i < amount; i++) {
      const card = removeTheseCards[i];
      fs.appendFileSync(file, card.getTxt());
    }

    fs.appendFileSync(file, "\r\n");

    logger.info(`file can be found in:\n\n-->  ${file}  <--\n`);
  }

  createHTML() {
    throw new Error("feature createHTML not finished.");
  }
}
