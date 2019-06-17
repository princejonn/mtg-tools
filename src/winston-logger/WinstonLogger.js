import os from "os";
import fs from "fs";
import path from "path";
import _ from "lodash";
import dateFns from "date-fns";
import winston from "winston";
import LogLevel from "./LogLevel";

export default class WinstonLogger {
  /**
   * @param {object} packageFile
   * @param {object} [options]
   * @param {string} [options.directory]
   * @param {number} [options.maxSize]
   * @param {number} [options.maxFiles]
   */
  constructor(packageFile, options = {}) {
    if (!_.isObject(packageFile)) {
      throw new Error(`packageFile not correctly defined in WinstonLogger [ ${packageFile} ]`);
    }

    this.packageName = packageFile.name;
    this.packageVersion = packageFile.version;
    this.maxSize = options.maxSize || 2621440;
    this.maxFiles = options.maxFiles || 20;

    this.directory = options.directory || path.join(os.homedir(), "logs");

    if (_.includes(this.packageName, "/")) {
      const split = this.packageName.split("/");
      this.directory = path.join(this.directory, split[0]);
      this.tailFile = path.join(this.directory, `${split[0].replace("@", "")}`);
      this.transportFile = path.join(this.directory, `${split[1]}`);
    } else {
      this.tailFile = path.join(this.directory, this.packageName);
      this.transportFile = path.join(this.directory, this.packageName);
    }

    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    this.winston = winston.createLogger({
      format: winston.format.json(),
      handleExceptions: true,
    });
  }

  /**
   * @param {string} level
   * @param {string} context
   * @param {Array<*>} message
   */
  log(level, context, ...message) {
    const array = [];

    for (const msg of message) {
      if (_.isError(msg)) {
        if (msg.stack) {
          array.push(msg.stack);
        } else {
          array.push(msg);
        }
      } else if (_.isObject(msg)) {
        array.push(JSON.stringify(msg));
      } else if (_.isArray(msg)) {
        array.push(msg.join(", "));
      } else {
        array.push(msg);
      }
    }

    const formatted = array.join(" ");

    this.winston.log({
      package: {
        name: this.packageName,
        version: this.packageVersion,
      },
      level,
      context,
      message: formatted,
    });
  }

  /**
   * @param {string} [level]
   * */
  addConsole(level = LogLevel.INFO) {
    this.winston.add(new winston.transports.Console({
      json: false,
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(this._formatPrintF),
        winston.format.colorize({ all: true }),
      ),
    }));
  }

  /**
   * @param {string} [level]
   * */
  addTail(level = LogLevel.DEBUG) {
    const fileName = `${this.tailFile}.tail.log`;
    this.winston.add(new winston.transports.File({
      json: false,
      maxsize: this.maxSize,
      maxFiles: this.maxFiles,
      level,
      filename: fileName,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(this._formatPrintF),
        winston.format.colorize({ all: true }),
      ),
    }));
  }

  /**
   * @param {string} [level]
   */
  addTransport(level = LogLevel.DEBUG) {
    const fileName = `${this.transportFile}.${level}.log`;
    this.winston.add(new winston.transports.File({
      json: true,
      maxsize: 2621440,
      maxFiles: 20,
      level,
      filename: fileName,
      format: winston.format.json(),
    }));
  }

  /**
   * @param {object} msg
   * @returns {string}
   * @private
   */
  _formatPrintF(msg) {
    const time = dateFns.format(msg.timestamp, "YYYY-MM-DD HH:mm:ss");
    const context = msg.context ? ` ${msg.context}` : "";
    const meta = `${time} ${msg.level.padEnd(7)} ${context}:`;
    const { message } = msg;
    return `${meta} ${message}`;
  }
}
