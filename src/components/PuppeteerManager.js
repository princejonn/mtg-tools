import puppeteer from "puppeteer";

export default class PuppeteerManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
  }
}
