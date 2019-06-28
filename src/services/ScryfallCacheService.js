/* eslint global-require: 0 */
/* eslint import/no-dynamic-require: 0 */

import path from "path";
import download from "download";
import { find, startsWith } from "lodash";
import humps from "lodash-humps";
import * as queryString from "query-string";
import request from "request-promise-native";
import Card from "models/Card";
import CacheTimeout from "utils/CacheTimeout";
import DateFns from "utils/DateFns";
import latinise from "utils/Latinise";
import NeDB, { Collection } from "utils/NeDB";
import RateLimit from "utils/RateLimit";
import TimerMessage from "utils/TimerMessage";

class ScryfallCacheService {
  constructor() {
    this._aliases = new NeDB(Collection.ALIASES);
    this._scryfall = new NeDB(Collection.SCRYFALL);

    this._loaded = false;
    this._file = null;
    this._cache = [];
  }

  /**
   * @param {string} id
   * @returns {Promise<Card>}
   */
  async getCard(id) {
    await this._load();
    const data = find(this._cache, { id });
    return new Card(humps(data));
  }

  /**
   * @param name
   * @returns {Promise<object>}
   */
  async find(name) {
    await this._load();

    const cacheResult = find(this._cache, { name });

    if (cacheResult && cacheResult.id) {
      return cacheResult;
    }

    const aliasResult = await this._aliases.find({ name });

    if (aliasResult && aliasResult.id) {
      const aliasFind = find(this._cache, { id: aliasResult.id });

      if (aliasFind && aliasFind.id) {
        return aliasFind;
      }
    }

    const complexResult = await this._complexFind(name);

    if (complexResult && complexResult.id) {
      await this._aliases.insert({ name, id: complexResult.id });
      return complexResult;
    }

    const apiResult = await ScryfallCacheService._searchAPI(name);

    if (apiResult && apiResult.id) {
      await this._aliases.insert({ name, id: apiResult.id });
      return apiResult;
    }
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _load() {
    if (this._loaded) return;

    if (!this._file) {
      await this._download();
    }

    const timerMessage = new TimerMessage("loading scryfall cache");

    this._cache = require(this._file);
    this._loaded = true;

    timerMessage.done();
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _download() {
    if (this._file) return;

    const name = "scryfall";
    const timeout = new CacheTimeout({ days: 1 });

    const info = await this._scryfall.find({ name });

    if (info && timeout.isOK(info.downloaded)) {
      this._file = info.file;
      return;
    }

    const timerMessage = new TimerMessage("downloading scryfall cache");

    const fileLink = "https://archive.scryfall.com/json/";
    const fileName = "scryfall-default-cards.json";

    await download(`${fileLink}${fileName}`, "cache");

    const downloaded = DateFns.format();
    const file = path.join(process.env.PWD, "cache", fileName);

    if (info) {
      await this._scryfall.update({ name }, { downloaded, file });
    } else {
      await this._scryfall.insert({ name, downloaded, file });
    }

    this._file = file;

    timerMessage.done();
  }

  /**
   * @param {string} name
   * @returns {Promise<object>}
   * @private
   */
  async _complexFind(name) {
    for (const card of this._cache) {
      if (latinise(name) === latinise(card.name)) {
        return card;
      }

      if (name.replace(/\s/g, "") === card.name.replace(/\s/g, "")) {
        return card;
      }

      if (ScryfallCacheService._parseQueryString(name) === ScryfallCacheService._parseQueryString(card.name)) {
        return card;
      }

      if (name.replace(/\//g, "") === card.name.replace(/\//g, "")) {
        return card;
      }

      if (startsWith(card.name, name)) {
        return card;
      }
    }
  }

  /**
   * @param {string} name
   * @returns {Promise<object>}
   * @private
   */
  static async _searchAPI(name) {
    const parsedName = queryString.parse(latinise(name));
    const query = queryString.stringify(parsedName);
    const url = `https://api.scryfall.com/cards/search?q=${query}`;
    let retry = 0;

    const timerMessage = new TimerMessage(`requesting api [ ${name} ]`);

    while (retry < 4) {
      await RateLimit.scryfall();

      try {
        const result = await request(url, { method: "GET" });
        const parsed = JSON.parse(result);

        for (const item of parsed.data) {
          if (latinise(name) !== latinise(item.name)) continue;
          return item;
        }

        console.log(`requesting api [ returning ] [ ${parsed.data[0].name} ]`);

        timerMessage.done();

        return parsed.data[0];
      } catch (err) {
        if (err.statusCode === 503) {
          retry += 1;
          console.log("error while trying to find card on scryfall. retrying:", retry);
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * @param {string} name
   * @returns {Promise<string>}
   * @private
   */
  static async _parseQueryString(name) {
    const parsed = queryString.parse(name);
    return queryString.stringify(parsed);
  }
}

const cache = new ScryfallCacheService();

export default cache;
