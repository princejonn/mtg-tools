import ora from "ora";

export default class OraSpinner {
  /**
   * @param {string} text
   */
  constructor(text) {
    this._text = text;
    this._spinner = ora({ color: "yellow" });
  }

  /**
   * @param {string} [text]
   */
  start(text) {
    if (!text) {
      text = this._text;
    }
    this._spinner.start(text);
  }

  /**
   * @param {string} [text]
   */
  succeed(text) {
    if (!text) {
      text = this._text;
    }
    this._spinner.succeed(text);
  }

  /**
   * @param {string} [text]
   */
  fail(text) {
    if (!text) {
      text = this._text;
    }
    this._spinner.fail(text);
  }
}
