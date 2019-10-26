import Logger from "utils/Logger";
import PuppeteerManager from "utils/PuppeteerManager";

export default class BasePage {
  constructor() {
    this._logger = Logger.getContextLogger("base-page");
    this._manager = new PuppeteerManager();
    this._initialized = false;
  }

  /**
   * @param {boolean} [headless]
   * @returns {Promise<void>}
   * @protected
   */
  async _init(headless) {
    if (this._initialized) return;
    await this._manager.init(headless);
    this._initialized = true;
  }

  /**
   * @param {string} url
   * @param {string} [waitForSelector]
   * @returns {Promise<void>}
   */
  async goto({ url, waitForSelector }) {
    this._logger.debug("going to page with options", { url, waitForSelector });
    await this._manager.goto({ url, waitForSelector });
  }

  /**
   * @param {string} selector
   * @returns {Promise<Puppeteer.ElementHandle>}
   */
  async find(selector) {
    await this.waitFor(selector);
    return this._manager.page.$(selector);
  }

  /**
   * @param {string} selector
   * @param {number} [timeout]
   * @returns {Promise<Array<Puppeteer.ElementHandle>>}
   */
  async findAll(selector, timeout) {
    await this.waitFor(selector, timeout);
    return this._manager.page.$$(selector);
  }

  /**
   * @param {string} selector
   * @returns {Promise<void>}
   */
  async click(selector) {
    this._logger.debug(`clicking selector [ ${selector} ]`);
    await this._manager.page.click(selector);
  }

  /**
   * @param {string} selector
   * @param text
   * @returns {Promise<void>}
   */
  async type(selector, text) {
    this._logger.debug(`typing text [ ${text} ] to selector [ ${selector} ]`);
    await this._manager.page.type(selector, text);
  }

  /**
   * @param {string} selector
   * @param {number} [timeout]
   * @returns {Promise<void>}
   */
  async waitFor(selector, timeout = 30000) {
    this._logger.debug(`waiting for selector [ ${selector} ]`);
    await this._manager.page.waitForSelector(selector, { timeout, visible: true });
  }

  /**
   * @param {Puppeteer.ElementHandle} element
   * @returns {Promise<string>}
   */
  async getText(element) {
    return this._manager.getElementText(element);
  }

  /**
   * @param {Puppeteer.ElementHandle} element
   * @param {string} attribute
   * @returns {Promise<string>}
   */
  async getAttribute(element, attribute) {
    return this._manager.getElementAttribute(element, attribute);
  }
}
