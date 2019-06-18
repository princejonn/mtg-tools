import { isFunction } from "lodash";
import logger from "logger";
import DomainTypeError from "errors/DomainTypeError";

export default class BasePage {
  /**
   * @param {object} page
   */
  constructor(page) {
    if (!isFunction(page.goto)) {
      throw new DomainTypeError({ page });
    }
    this.page = page;
  }

  /**
   * @param {string} url
   * @param {string} waitForSelector
   * @returns {Promise<void>}
   */
  async goto({ url, waitForSelector }) {
    logger.debug("going to url", url);
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
}
