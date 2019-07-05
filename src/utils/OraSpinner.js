import ora from "ora";
import { differenceInMilliseconds, differenceInMinutes, differenceInSeconds } from "date-fns";

export default class OraSpinner {
  /**
   * @param {string} text
   */
  constructor(text) {
    this._spinner = ora({ color: "yellow" });
    this._date = null;
    this._text = {
      text: text,
      currentTask: 0,
      totalTasks: 0,
    }
  }

  /**
   * @param {string} [text]
   */
  start(text) {
    if (text) {
      this._text.text = text;
    }

    this._date = new Date();
    this._spinner.start(this._text.text);
    this._render();
  }

  /**
   * @param {string} [text]
   */
  succeed(text) {
    if (text) {
      this._text.text = text;
    }

    const time = this._getEndTime();
    this._spinner.succeed(`${this._text.text} ${time}`);
  }

  /**
   * @param {string} [text]
   */
  fail(text) {
    if (text) {
      this._text.text = text;
    }

    const time = this._getEndTime();
    this._spinner.fail(`${this._text.text} ${time}`);
  }

  /**
   * @param {number} number
   */
  setTotalTasks(number) {
    this._text.totalTasks = number;
    this._render();
  }

  /**
   */
  startTask() {
    this._text.currentTask += 1;
    this._render();
  }

  /**
   * @private
   */
  _render() {
    if (this._text.totalTasks > 1) {
      this._spinner.text = `${this._text.text} [${this._text.currentTask}/${this._text.totalTasks}]`;
    } else {
      this._spinner.text = this._text.text;
    }
  }

  _getEndTime() {
    const mm = differenceInMinutes(new Date(), this._date);
    if (mm > 0) {
      return `(${mm}m)`;
    }

    const ss = differenceInSeconds(new Date(), this._date);
    if (ss > 0) {
      return `(${ss}s)`;
    }

    const ms = differenceInMilliseconds(new Date(), this._date);
    return `(${ms}ms)`;
  }
}
