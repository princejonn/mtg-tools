import PuppeteerManager from "utils/PuppeteerManager";

export default class BasePage {
  constructor() {
    this._manager = new PuppeteerManager();
    this._initialized = false;
  }

  /**
   * @returns {Promise<void>}
   * @protected
   */
  async _init() {
    if (this._initialized) return;
    await this._manager.init();
    this._initialized = true;
  }

  /**
   * @param options
   * @returns {Promise<void>}
   */
  async goto(options) {
    await this._manager.goto(options);
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
   * @returns {Promise<Array<Puppeteer.ElementHandle>>}
   */
  async findAll(selector) {
    await this.waitFor(selector);
    return this._manager.page.$$(selector);
  }

  /**
   * @param {string} selector
   * @returns {Promise<void>}
   */
  async click(selector) {
    await this._manager.page.click(selector);
  }

  /**
   * @param {string} selector
   * @param text
   * @returns {Promise<void>}
   */
  async type(selector, text) {
    await this._manager.page.type(selector, text);
  }

  /**
   * @param {string} selector
   * @returns {Promise<void>}
   */
  async waitFor(selector) {
    await this._manager.page.waitForSelector(selector, { visible: true });
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
