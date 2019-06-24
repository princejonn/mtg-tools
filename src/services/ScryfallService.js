import { includes, startsWith } from "lodash";
import humps from "lodash-humps";
import * as queryString from "query-string";
import request from "request-promise-native";
import Card from "models/Card";
import CacheTimeout from "utils/CacheTimeout";
import Latinise from "utils/Latinise";
import RateLimit from "utils/RateLimit";
import NeDB, { Collection } from "../utils/NeDB";

export default class ScryfallService {
  /**
   * @param {string} name
   * @returns {Promise<Card>}
   */
  static async findCard(name) {
    const timeout = new CacheTimeout({ years: 1 });
    const db = new NeDB(Collection.CARDS);
    const cached = await ScryfallService._findInDb(db, name);

    let data = {};

    if (cached && timeout.isOK(cached.created)) {
      return new Card(cached);
    } if (cached && !timeout.isOK(cached.created)) {
      console.log("found card in database with expired timeout. fetching from card uri on scryfall:", cached.uri);
      await db.remove({ id: cached.id });
      data = await ScryfallService._getCard(cached.uri);
    } else {
      console.log("searching for card on scryfall:", name);
      data = await ScryfallService._findCard(name);
    }

    await ScryfallService._saveToDb(db, data);

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
          item.aliases = [ item.name ];
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
   * @param {NeDB} db
   * @param {Card} data
   * @private
   */
  static async _saveToDb(db, data) {
    const { id } = data;
    const exists = await db.find({ id });

    if (!exists) {
      return db.insert(data);
    }

    if (!exists.uri === data.uri) {
      console.log(data);
      console.log(exists);
      throw new Error("cards with matching ids do not match on [ uri ]");
    }
  }

  /**
   * @param {NeDB} db
   * @param {string} name
   * @returns {Card}
   * @private
   */
  static async _findInDb(db, name) {
    const latinized = Latinise(name);
    const exists = await db.find({ name: latinized });

    if (exists) {
      return exists;
    }

    const table = await db.get();

    for (const card of table) {
      const aliases = card.aliases || [];

      if (includes(aliases, latinized)) {
        return card;
      }

      const latinizedNoSpaces = latinized.replace(/\s/g, "");

      if (includes(aliases, latinizedNoSpaces)) {
        return card;
      }

      if (card.name.replace(/\s/g, "") === latinizedNoSpaces) {
        aliases.push(latinizedNoSpaces);
        await db.update({ id: card.id }, { aliases });
        return card;
      }

      const latinizedParsed = queryString.parse(latinized);
      const latinizedQueryString = queryString.stringify(latinizedParsed);

      if (includes(aliases, latinizedQueryString)) {
        return card;
      }

      const cardNameParsed = queryString.parse(card.name);
      const cardNameQueryString = queryString.stringify(cardNameParsed);

      if (latinizedQueryString === cardNameQueryString) {
        aliases.push(latinizedQueryString);
        await db.update({ id: card.id }, { aliases });
        return card;
      }

      const n1 = latinized.replace(/\//g, "");
      const n2 = card.name.replace(/\//g, "");

      if (n1 === n2) {
        aliases.push(latinized);
        await db.update({ id: card.id }, { aliases });
        return card;
      }

      if (startsWith(card.name, latinized)) {
        aliases.push(latinized);
        await db.update({ id: card.id }, { aliases });
        return card;
      }
    }

    return null;
  }
}
