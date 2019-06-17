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
}
