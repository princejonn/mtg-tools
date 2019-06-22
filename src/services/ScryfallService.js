import { includes, startsWith } from "lodash";
import * as queryString from "query-string";
import request from "request-promise-native";
import logger from "logger";
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
      return cached;
    } if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found card in database with expired timeout. fetching from card uri on scryfall", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    }

    ScryfallService._saveToDb(db, data);

    return data;
  }

  /**
   * @param {string} name
   * @returns {Promise<Card>}
   */
  static async findCard(name) {
    const regExps = [
      /(.*(Basic)*.*Plains.*)/,
      /(.*(Basic)*.*Swamp.*)/,
      /(.*(Basic)*.*Mountain.*)/,
      /(.*(Basic)*.*Island.*)/,
      /(.*(Basic)*.*Forest.*)/,
    ];

    for (const regex of regExps) {
      if (name.match(regex)) return null;
    }

    const timeout = new CacheTimeout({ years: 1 });
    const db = new LowDB(Table.SCRYFALL_CARDS);

    const cached = ScryfallService._findInDb(db, name);
    let data = {};

    if (cached && timeout.isOK(cached.created)) {
      return cached;
    } if (cached && !timeout.isOK(cached.created)) {
      logger.debug("found card in database with expired timeout. fetching from card uri on scryfall", cached.uri);
      db.remove(cached.id);
      data = await ScryfallService._getCard(cached.uri);
    } else {
      logger.debug("searching for card on scryfall", name);
      data = await ScryfallService._findCard(name);
    }

    ScryfallService._saveToDb(db, data);

    return data;
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
    parsed.name = Latinise(parsed.name);
    return ScryfallService._parseCard(parsed);
  }

  /**
   * @param {string} name
   * @returns {Promise<object>}
   * @private
   */
  static async _findCard(name) {
    await RateLimit.scryfall();

    const parsedName = queryString.parse(Latinise(name));
    const query = queryString.stringify(parsedName);
    const url = `https://api.scryfall.com/cards/search?q=${query}`;

    const result = await request(url, { method: "GET" });
    const parsed = JSON.parse(result);

    for (const item of parsed.data) {
      item.name = Latinise(item.name);
      if (item.name !== name) continue;
      return ScryfallService._parseCard(item);
    }

    return ScryfallService._parseCard(parsed.data[0]);
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
      db.push(data);
      return;
    }

    if (!exists.uri === data.uri) {
      logger.debug(data);
      logger.debug(exists);

      throw new Error("cards with matching ids do not match on [ mtgo_id|arena_id|tcgplayer_id ]");
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
    const table = db.find();
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

  static _parseCard(data) {
    const {
      id,
      name,
      mana_cost,
      scryfall_uri,
    } = data;

    let image;

    if (data.image_uris) {
      image = data.image_uris.normal;
    } else if (data.card_faces && data.card_faces.length) {
      image = data.card_faces[0].image_uris.normal;
    }

    return {
      id,
      name,
      image,
      manaCost: mana_cost,
      uri: scryfall_uri.replace("?utm_source=api", ""),
    };
  }
}
