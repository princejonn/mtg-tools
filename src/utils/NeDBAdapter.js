import Datastore from "nedb";
import DateFns from "utils/DateFns";

export const Collection = {
  CARDS: "cards",
  COMMANDERS: "commanders",
  DECKS: "decks",
  LINKS: "links",
  RECOMMENDATIONS: "recommendations",
  THEMES: "themes",
};

class NeDBAdapter {
  constructor() {
    this._db = {};

    for (const key in Collection) {
      if (!Collection.hasOwnProperty(key)) continue;
      const collection = Collection[key];
      this._db[collection] = new Datastore({ filename: `db-${collection}.db`, autoload: true });
    }
  }

  async get(collection) {
    return new Promise((resolve, reject) => {
      this._db[collection].find({}, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

  async find(collection, query) {
    return new Promise((resolve, reject) => {
      this._db[collection].find(query, (err, docs) => {
        if (err) reject(err);
        resolve(docs);
      });
    });
  }

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

  async update(collection, query, data) {
    return new Promise((resolve, reject) => {
      this._db[collection].update(query, { $set: data }, {}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

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
