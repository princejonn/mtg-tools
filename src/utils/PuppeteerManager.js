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
    this.browser = await puppeteer.launch({
      headless,
      defaultViewport: null,
    });
    this.page = await this.browser.newPage();
  }

  /**
   * @param {string} url
   * @param {string} [waitForSelector]
   * @returns {Promise<void>}
   */
  async goto({ url, waitForSelector }) {
    await this.page.close();
    this.page = await this.browser.newPage();
    await this.page.bringToFront();
    await this.page.goto(url);
    if (!waitForSelector) return;
    await this.page.waitForSelector(waitForSelector, { visible: true });
  }

  /**
   * @param {Puppeteer.ElementHandle} element
   * @param {string} attribute
   * @returns {Promise<string>}
   */
  async getElementAttribute(element, attribute) {
    return this.page.evaluate((e, a) => {
      return e.getAttribute(a);
    }, element, attribute);
  }

  /**
   * @param {Puppeteer.ElementHandle} element
   * @returns {Promise<string>}
   */
  async getElementText(element) {
    return this.page.evaluate(e => {
      return e.textContent;
    }, element);
  }

  /**
   * @returns {Promise<void>}
   */
  async interceptImages() {
    await this.page.setRequestInterception(true);

    this.page.on("request", request => {
      if (request.resourceType() === "image") {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  destroy() {
    if (!this.browser) return;
    this.browser.close();
  }
}
