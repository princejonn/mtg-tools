import OraSpinner from "./OraSpinner";

class Spinners {
  constructor() {
    this._spinners = [];
  }

  /**
   * @param {string} [text]
   */
  start(text) {
    this._spinners.push(new OraSpinner(text));
    for (const spinner of this._spinners) {
      spinner.start(text);
    }
  }

  /**
   * @param {string} [text]
   */
  succeed(text) {
    for (const spinner of this._spinners) {
      spinner.succeed(text);
    }
    this._spinners = [];
  }

  /**
   * @param {string} [text]
   */
  fail(text) {
    for (const spinner of this._spinners) {
      spinner.fail(text);
    }
    this._spinners = [];
  }
}

const spinners = new Spinners();

export default spinners;
