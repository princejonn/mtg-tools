import fs from "fs";
import path from "path";
import dateFns from "date-fns";
import { isString, isFunction } from "lodash";
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

    this.commander = commanderQueryString;
    this.deckList = deckList;
    this.pwd = process.env.PWD;
    this.now = dateFns.format(new Date(), "YYYY-MM-DDTHH_mm_ss");
    this.cwd = path.join(this.pwd, "reports");

    if (!fs.existsSync(this.cwd)) {
      fs.mkdirSync(this.cwd);
    }
  }

  async create() {
    const file = path.join(this.cwd, `${this.commander}-${this.now}.html`);

    const html = await improveReportTemplate(this.commander, this.deckList);
    fs.appendFileSync(file, html);

    console.log(`file can be found in:\n\n-->  ${file}  <--\n`);
  }
}
