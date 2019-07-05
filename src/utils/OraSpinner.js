import ora from "ora";
import { differenceInMilliseconds, differenceInSeconds } from "date-fns";

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

    const time = differenceInSeconds(new Date(), this._date);

    this._spinner.succeed(`${this._text.text} (${time}s)`);
  }

  /**
   * @param {string} [text]
   */
  fail(text) {
    if (text) {
      this._text.text = text;
    }

    const time = differenceInMilliseconds(new Date(), this._date);

    this._spinner.fail(`${this._text.text} (${time}ms)`);
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

  _render() {
    if (this._text.totalTasks > 1) {
      this._spinner.text = `${this._text.text} [${this._text.currentTask}/${this._text.totalTasks}]`;
    } else {
      this._spinner.text = this._text.text;
    }
  }
}
