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
}
