import includes from "lodash/includes";
import TappedOutShareLink from "models/TappedOutShareLink";
import NeDB, { Collection } from "utils/NeDB";

class ShareLinkService {
  constructor() {
    this._db = new NeDB(Collection.SHARE_LINKS);
  }

  /**
   * @param {string} url
   * @returns {Promise<TappedOutShareLink>}
   */
  async getOrSet(url) {
    if (includes(url, "?share=")) {
      await this.save(url);
    }

    return this.get(url);
  }

  /**
   * @param {string} url
   * @returns {Promise<void>}
   */
  async remove(url) {
    const commander = this.getCommanderId(url);
    await this._db.remove({ commander });
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  isShare(url) {
    return includes(url, "?share");
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  getCommanderId(url) {
    const split = url.split("tappedout.net/mtg-decks/");
    const string = split[1].replace(/\//g, "");

    if (!this.isShare(string)) {
      return string;
    }

    const cmdrSplit = string.split("?share=");
    return cmdrSplit[0];
  }

  /**
   * @param {string} url
   * @returns {Promise<TappedOutShareLink>}
   */
  async get(url) {
    const commander = this.getCommanderId(url);
    const exists = await this._db.find({ commander });

    if (!exists) {
      return null;
    }

    return new TappedOutShareLink(exists);
  }

  /**
   * @param {string} url
   * @returns {Promise<void>}
   */
  async save(url) {
    const commander = this.getCommanderId(url);
    const exists = await this._db.find({ commander });

    if (!includes(url, "https://") && !includes(url, "http://")) {
      url = `https://${url}`;
    }

    if (exists) {
      if (url === exists.link) {
        return;
      }
      return this._db.update({ commander }, { link: url });
    }

    await this._db.insert({ commander, link: url });
  }
}

const service = new ShareLinkService();

export default service;
