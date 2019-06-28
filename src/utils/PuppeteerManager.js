import puppeteer from "puppeteer";

export default class PuppeteerManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * @param {boolean} [headless]
   * @returns {Promise<void>}
   */
  async init(headless = true) {
    this.browser = await puppeteer.launch({ headless });
    this.page = await this.browser.newPage();
  }

  /**
   * @param {string} url
   * @param {string} waitForSelector
   * @returns {Promise<void>}
   */
  async goto({ url, waitForSelector }) {
    await this.page.goto(url);
    await this.page.waitForSelector(waitForSelector, { visible: true });
  }

  /**
   * @param {object} element
   * @param {string} attribute
   * @returns {Promise<string>}
   */
  async getElementAttribute(element, attribute) {
    return this.page.evaluate((e, a) => {
      return e.getAttribute(a);
    }, element, attribute);
  }

  /**
   * @param {object} element
   * @returns {Promise<string>}
   */
  async getElementText(element) {
    return this.page.evaluate(e => {
      return e.textContent;
    }, element);
  }

  destroy() {
    this.browser.close();
  }
}
