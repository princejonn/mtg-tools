import * as queryString from "query-string";
import request from "request-promise-native";
import logger from "logger";
import Card from "models/Card";
import CacheTimeout from "utils/CacheTimeout";
import LowDB, { Table } from "utils/LowDB";
import RateLimit from "utils/RateLimit";

export default class ScryfallService {
  /**
   * @param {string} id
   * @returns {Promise<Card>}
   */
  static async getCard(id) {
    const timeout = new CacheTimeout({ years: 1 });
    const db = new LowDB(Table.SCRYFALL_CARDS);

    const cached = db.find({ id });
    let data = {};

    if (cached && timeout.isOK(cached.created)) {
      return new Card(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found card in database with expired timeout. fetching from card uri on scryfall", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    }

    db.push(data);

    return new Card(data);
  }

  /**
   * @param {string} name
   * @returns {Promise<Card>}
   */
  static async findCard(name) {
    const regExps = [
      /(.*Basic.*Plains.*)/,
      /(.*Basic.*Swamp.*)/,
      /(.*Basic.*Mountain.*)/,
      /(.*Basic.*Island.*)/,
      /(.*Basic.*Forest.*)/,
    ];

    for (const regex of regExps) {
      if (name.match(regex)) return null;
    }

    const timeout = new CacheTimeout({ years: 1 });
    const db = new LowDB(Table.SCRYFALL_CARDS);

    let cached = db.find({ name });
    let data = {};

    if (cached && timeout.isOK(cached.created)) {
      return new Card(cached);
    } else if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found card in database with expired timeout. fetching from card uri on scryfall", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    } else {
      logger.debug("searching for card on scryfall", name);
      data = await ScryfallService._findCard(name);
    }

    db.push(data);

    return new Card(data);
  }

  /**
   * @param {string} uri
   * @returns {Promise<object>}
   * @private
   */
  static async _getCard(uri) {
    await RateLimit.scryfall();
    const result = await request(uri, { method: "GET" });
    return JSON.parse(result);
  }

  /**
   * @param {string} name
   * @returns {Promise<object>}
   * @private
   */
  static async _findCard(name) {
    await RateLimit.scryfall();

    const parsedName = queryString.parse(name);
    const query = queryString.stringify(parsedName);
    const url = `https://api.scryfall.com/cards/search?q=${query}`;

    const result = await request(url, { method: "GET" });
    const parsed = JSON.parse(result);

    logger.debug("trying to find exact card match", name);

    for (const item of parsed.data) {
      if (item.name !== name) continue;
      return item;
    }

    logger.debug("could not find an exact match, returning first card of list");

    return parsed.data[0];
  }
}
