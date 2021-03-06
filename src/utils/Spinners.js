import OraSpinner from "./OraSpinner";

class Spinners {
  constructor() {
    this._spinners = [];
  }

  /**
   * @param {string} text
   */
  next(text) {
    if (this._spinners.length) {
      this.succeed();
    }
    this.start(text);
  }

  /**
   * @param {string} text
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

  /**
   * @param {number} number
   */
  setTotalTasks(number) {
    for (const spinner of this._spinners) {
      spinner.setTotalTasks(number);
    }
  }

  /**
   */
  startTask() {
    for (const spinner of this._spinners) {
      spinner.startTask();
    }
  }
}

const spinners = new Spinners();

export default spinners;
