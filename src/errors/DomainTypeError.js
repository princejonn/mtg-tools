/* eslint-disable */
export default class DomainTypeError extends Error {
  /**
   * @param {object} variable
   */
  constructor(variable) {
    super();

    this.name = this.constructor.name;
    this.key = Object.keys(variable)[0];
    this.actual = variable[this.key];
    this.message = `${this.key} [ ${this.actual} ] not correctly defined`;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(this.message)).stack;
    }
  }
}
