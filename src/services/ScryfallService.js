/* eslint global-require: 0 */

import fs from "fs";
import path from "path";
import download from "download";
import find from "lodash/find";
import includes from "lodash/includes";
import startsWith from "lodash/startsWith";
import humps from "lodash-humps";
import * as queryString from "query-string";
import request from "request-promise-native";
import Card from "components/Card";
import CacheTimeout from "utils/CacheTimeout";
import DateFns from "utils/DateFns";
import latinise from "utils/Latinise";
import NeDB, { Collection } from "utils/NeDB";
import RateLimit from "utils/RateLimit";
import searchString from "utils/SearchString";

class ScryfallService {
  constructor() {
    this._aliases = new NeDB(Collection.ALIASES);
    this._scryfall = new NeDB(Collection.SCRYFALL);

    this._loaded = false;
    this._file = null;
    this._cache = [];
    this._names = [];
  }

  /**
   * @param {string} id
   * @returns {Promise<Card>}
   */
  async getCard(id) {
    await this.load();
    const data = find(this._cache, { id });
    return new Card(humps(data));
  }

  /**
   * @returns {Array<string>}
   */
  getNames() {
    return this._names;
  }

  /**
   * @param name
   * @returns {Promise<object>}
   */
  async find(name) {
    await this.load();

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

    const apiResult = await ScryfallService._searchAPI(name);

    if (apiResult && apiResult.id) {
      await this._aliases.insert({ name, id: apiResult.id });
      return apiResult;
    }
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async load() {
    if (this._loaded) return;

    if (!this._file) {
      await this._download();
    }

    this._cache = await this._readFile();

    for (const card of this._cache) {
      const name = searchString(card.name);
      if (includes(this._names, name)) continue;
      this._names.push(name);
    }

    this._loaded = true;
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

      if (ScryfallService._parseQueryString(name) === ScryfallService._parseQueryString(card.name)) {
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
    if (includes(name, "//")) {
      const split = name.split("//");
      name = split[0].trim();
    }

    const parsedName = queryString.parse(latinise(name));
    const query = queryString.stringify(parsedName);
    const url = `https://api.scryfall.com/cards/search?q=${query}`;

    await RateLimit.scryfall();
    const result = await request(url, { method: "GET" });
    const parsed = JSON.parse(result);

    for (const item of parsed.data) {
      if (latinise(name) !== latinise(item.name)) continue;
      return item;
    }

    return parsed.data[0];
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

  /**
   * @returns {Promise<object>}
   * @private
   */
  async _readFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(this._file, (err, buffer) => {
        if (err) reject(err);
        const string = buffer.toString();
        const json = JSON.parse(string);
        resolve(json);
      });
    });
  }
}

const service = new ScryfallService();

export default service;
