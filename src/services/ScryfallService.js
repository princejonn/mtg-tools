import { includes, startsWith } from "lodash";
import humps from "lodash-humps";
import * as queryString from "query-string";
import request from "request-promise-native";
import Card from "models/Card";
import CacheTimeout from "utils/CacheTimeout";
import Latinise from "utils/Latinise";
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
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found card in database with expired timeout. fetching from card uri on scryfall:", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    }

    if (!data) ScryfallService._saveToDb(db, data);

    return new Card(data);
  }

  /**
   * @param {string} name
   * @returns {Promise<Card>}
   */
  static async findCard(name) {
    const timeout = new CacheTimeout({ years: 1 });
    const db = new LowDB(Table.SCRYFALL_CARDS);

    const cached = ScryfallService._findInDb(db, name);
    let data = {};

    if (cached && timeout.isOK(cached.created)) {
      return new Card(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found card in database with expired timeout. fetching from card uri on scryfall:", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    } else {
      console.log("searching for card on scryfall:", name);
      data = await ScryfallService._findCard(name);
    }

    ScryfallService._saveToDb(db, data);

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
    const parsed = JSON.parse(result);
    const humped = humps(parsed);
    humped.name = Latinise(humped.name);
    return humped;
  }

  /**
   * @param {string} name
   * @returns {Promise<object>}
   * @private
   */
  static async _findCard(name) {
    const parsedName = queryString.parse(Latinise(name));
    const query = queryString.stringify(parsedName);
    const url = `https://api.scryfall.com/cards/search?q=${query}`;
    let retry = 0;

    while (retry < 4) {
      await RateLimit.scryfall();

      try {
        const result = await request(url, { method: "GET" });
        const parsed = JSON.parse(result);

        for (const item of parsed.data) {
          item.name = Latinise(item.name);
          if (item.name !== name) continue;
          return humps(item);
        }

        return humps(parsed.data[0]);
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
   * @param {LowDB} db
   * @param {Card} data
   * @private
   */
  static _saveToDb(db, data) {
    const { id } = data;
    const exists = db.find({ id });

    if (!exists) {
      return db.push(data);
    }

    if (!exists.uri === data.uri) {
      console.log(data);
      console.log(exists);
      throw new Error("cards with matching ids do not match on [ uri ]");
    }
  }

  /**
   * @param {LowDB} db
   * @param {string} name
   * @returns {Card}
   * @private
   */
  static _findInDb(db, name) {
    name = Latinise(name);

    const exists = db.find({ name });

    if (exists) {
      return exists;
    }

    const array = [];
    const table = db.get();

    for (const card of table) {
      if (!startsWith(card.name, "name")) continue;
      array.push(card);
    }

    for (const card of array) {
      if (!includes(card.name, "//")) continue;
      return card;
    }

    return null;
  }
}
