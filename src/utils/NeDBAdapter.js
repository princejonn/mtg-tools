import fs from "fs";
import path from "path";
import Datastore from "nedb";
import DateFns from "utils/DateFns";

export const Collection = {
  ALIASES: "aliases",
  COMMANDERS: "commanders",
  DECKS: "decks",
  INVENTORY: "inventory",
  LINKS: "links",
  RECOMMENDATIONS: "recommendations",
  SCRYFALL: "scryfall",
  THEMES: "themes",
};

class NeDBAdapter {
  constructor() {
    this._db = {};
    this._files = {};

    for (const key in Collection) {
      if (!Collection.hasOwnProperty(key)) continue;
      const collection = Collection[key];
      const file = path.join(process.env.PWD, "db", `${collection}.db`);
      this._files[collection] = file;
      this._setDatastore(collection, file);
    }
  }

  /**
   * @param {string} collection
   * @param {object} [query]
   * @param {object} [sort]
   * @param {number} [limit]
   * @returns {Promise}
   */
  async find(collection, { query, sort, limit }) {
    return new Promise((resolve, reject) => {
      this._db[collection].find(query).sort(sort).limit(limit).exec((err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  /**
   * @param {string} collection
   * @param {object} data
   * @returns {Promise}
   */
  async insert(collection, data) {
    if (!Object.keys(data).length) {
      throw new Error("trying to push an empty data object");
    }
    if (!data.created) {
      data.created = DateFns.format();
    }
    if (!data._id && data.id) {
      data._id = data.id;
    }

    return new Promise((resolve, reject) => {
      this._db[collection].insert(data, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  /**
   * @param {string} collection
   * @param {object} query
   * @param {object} data
   * @returns {Promise}
   */
  async update(collection, query, data) {
    return new Promise((resolve, reject) => {
      this._db[collection].update(query, { $set: data }, {}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  /**
   * @param {string} collection
   * @param {object} query
   * @returns {Promise}
   */
  async remove(collection, query) {
    return new Promise((resolve, reject) => {
      this._db[collection].remove(query, {}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async resetFile(collection) {
    const file = this._files[collection];
    fs.unlinkSync(file);
    this._setDatastore(collection, file);
  }

  /**
   * @param {string} collection
   * @param {string} file
   * @private
   */
  _setDatastore(collection, file) {
    this._db[collection] = new Datastore({
      filename: file,
      timestampData: true,
      autoload: true,
    });
  }
}

const adapter = new NeDBAdapter();

export default adapter;
