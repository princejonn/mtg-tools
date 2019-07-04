import ora from "ora";
import dateFns from "date-fns";

export default class OraSpinner {
  /**
   * @param {string} text
   */
  constructor(text) {
    this._text = text;
    this._date = null;
    this._spinner = ora({ color: "yellow" });
  }

  /**
   * @param {string} [text]
   */
  start(text) {
    if (!text) {
      text = this._text;
    }
    this._date = new Date();
    this._spinner.start(text);
  }

  /**
   * @param {string} [text]
   */
  succeed(text) {
    if (!text) {
      text = this._text;
    }
    const time = dateFns.differenceInMilliseconds(new Date(), this._date);
    this._spinner.succeed(`${text} (${time}ms)`);
  }

  /**
   * @param {string} [text]
   */
  fail(text) {
    if (!text) {
      text = this._text;
    }
    const time = dateFns.differenceInMilliseconds(new Date(), this._date);
    this._spinner.fail(`${text} (${time}ms)`);
  }
}
