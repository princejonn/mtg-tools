import fs from "fs";
import path from "path";
import dateFns from "date-fns";
import { isString, isFunction } from "lodash";
import logger from "logger";
import DomainTypeError from "errors/DomainTypeError";
import improveReportTemplate from "templates/improve-report-template";

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

    this.commanderQueryString = commanderQueryString;
    this.deckList = deckList;
    this.pwd = process.env.PWD;
    this.now = dateFns.format(new Date(), "YYYY-MM-DDTHH_mm_ss");
    this.cwd = path.join(this.pwd, "reports");

    if (!fs.existsSync(this.cwd)) {
      fs.mkdirSync(this.cwd);
    }
  }

  async create() {
    const file = path.join(this.cwd, `${this.commanderQueryString}-${this.now}.html`);

    const html = await improveReportTemplate(this.commanderQueryString, this.deckList);
    fs.appendFileSync(file, html);

    logger.verbose(`report generated [ ${file} ]`);

    console.log(`file can be found in:\n\n-->  ${file}  <--\n`);
  }
}
