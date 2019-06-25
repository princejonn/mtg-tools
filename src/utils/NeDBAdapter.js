import Datastore from "nedb";
import DateFns from "utils/DateFns";

export const Collection = {
  ALIASES: "aliases",
  COMMANDERS: "commanders",
  DECKS: "decks",
  LINKS: "links",
  RECOMMENDATIONS: "recommendations",
  SCRYFALL: "scryfall",
  THEMES: "themes",
};

class NeDBAdapter {
  constructor() {
    this._db = {};

    for (const key in Collection) {
      if (!Collection.hasOwnProperty(key)) continue;
      const collection = Collection[key];
      this._db[collection] = new Datastore({ filename: `db/${collection}.db`, timestampData: true, autoload: true });
    }
  }

  /**
   * @param {string} collection
   * @param {object} query
   * @returns {Promise}
   */
  async find(collection, query) {
    return new Promise((resolve, reject) => {
      this._db[collection].find(query, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  /**
   * @param {string} collection
   * @param {object} query
   * @param sort
   * @returns {Promise}
   */
  async findSort(collection, query, sort) {
    return new Promise((resolve, reject) => {
      this._db[collection].find(query).sort(sort).exec((err, docs) => {
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
}

const adapter = new NeDBAdapter();

export default adapter;
