import clone from "lodash/clone";
import isString from "lodash/isString";
import WinstonLogger from "winston-logger/WinstonLogger";
import LogLevel from "winston-logger/LogLevel";

export default class Logger {
  /**
   * @param {string} context
   * @param {object} [options]
   * @param {string} [options.packageFile]
   * @param {Logger} [options.parent]
   * @param {string} [options.directory]
   * @param {number} [options.maxSize]
   * @param {number} [options.maxFiles]
   */
  constructor(context, options = {}) {
    if (!isString(context)) {
      throw new Error(`context not correctly defined in Logger [ ${context} ]`);
    }

    if (!!options.packageFile && !options.parent) {
      this.winston = new WinstonLogger(options.packageFile, { ...options });
      this.contextArray = [];
      this.root = this;
    } else if (!!options.parent && !options.packageFile) {
      this.contextArray = clone(options.parent.contextArray);
      this.root = options.parent.root;
    } else {
      throw new Error("Logger not correctly initiated.");
    }

    this.contextArray.push(context);
    this.context = this.contextArray.join(".");
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  error(...message) {
    this._log(LogLevel.ERROR, ...message);
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  warn(...message) {
    this._log(LogLevel.WARN, ...message);
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  info(...message) {
    this._log(LogLevel.INFO, ...message);
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  verbose(...message) {
    this._log(LogLevel.VERBOSE, ...message);
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  debug(...message) {
    this._log(LogLevel.DEBUG, ...message);
  }

  /**
   * @param {string|number|boolean|array|object} message
   */
  silly(...message) {
    this._log(LogLevel.SILLY, ...message);
  }

  /**
   * @param {string} [level]
   */
  addConsole(level) {
    this.root.winston.addConsole(level);
  }

  /**
   * @param {string} [level]
   */
  addTail(level) {
    this.root.winston.addTail(level);
  }

  /**
   * @param {string} [level]
   */
  addTransport(level) {
    this.root.winston.addTransport(level);
  }

  /**
   * @param {string} context
   * @returns {Logger}
   */
  getContextLogger(context) {
    return new Logger(context, { parent: this });
  }

  /**
   * @param {string} level
   * @param {Array<*>} message
   * @private
   */
  _log(level, ...message) {
    this.root.winston.log(level, this.context, ...message);
  }
}
