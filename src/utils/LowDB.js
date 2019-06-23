import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import DateFns from "utils/DateFns";
import InMemoryCache from "utils/InMemoryCache";

export const Database = {
  EDHREC: "db-edhrec.json",
  SCRYFALL: "db-scryfall.json",
  TAPPED_OUT: "db-tappedout.json",
};

export const Defaults = {
  EDHREC: { themes: [], recommendations: [] },
  SCRYFALL: { cards: [] },
  TAPPED_OUT: { commanders: [], decks: [], links: [] },
};

export const Table = {
  EDHREC_THEMES: { table: "themes", db: Database.EDHREC, defaults: Defaults.EDHREC },
  EDHREC_RECOMMENDATIONS: { table: "recommendations", db: Database.EDHREC, defaults: Defaults.EDHREC },

  SCRYFALL_CARDS: { table: "cards", db: Database.SCRYFALL, defaults: Defaults.SCRYFALL },

  TAPPED_OUT_COMMANDERS: { table: "commanders", db: Database.TAPPED_OUT, defaults: Defaults.TAPPED_OUT },
  TAPPED_OUT_DECKS: { table: "decks", db: Database.TAPPED_OUT, defaults: Defaults.TAPPED_OUT },
  TAPPED_OUT_LINKS: { table: "links", db: Database.TAPPED_OUT, defaults: Defaults.TAPPED_OUT },
};

export default class LowDB {
  /**
   * @param {string} db
   * @param {string} table
   * @param {object} defaults
   */
  constructor({ db, table, defaults }) {
    if (!db) {
      throw new Error("db is undefined");
    }
    if (!table) {
      throw new Error("table is undefined");
    }
    this._db = low(new FileSync(db));
    this._name = db;
    this._table = table;
    this._db.defaults(defaults).write();
    this._initCache();
  }

  get() {
    return InMemoryCache.get(this._name, this._table);
  }

  /**
   * @param {object} query
   */
  find(query) {
    return InMemoryCache.find(this._name, this._table, query);
  }

  /**
   * @param {object} data
   */
  push(data) {
    if (this.find({ id: data.id })) {
      throw new Error(`a post with this id already exists: [ ${data.id} ]`);
    }
    if (!Object.keys(data).length) {
      throw new Error("trying to push an empty data object");
    }

    const object = { ...data, created: DateFns.now() };

    InMemoryCache.push(this._name, this._table, object);

    this._db.get(this._table)
      .push(object)
      .write();
  }

  /**
   * @param {string} id
   * @param {object} data
   */
  assign(id, data) {
    if (!id) {
      throw new Error("id is undefined");
    }
    if (!data) {
      throw new Error("data is undefined");
    }

    InMemoryCache.assign(this._name, this._table, { id }, data);

    this._db.get(this._table)
      .find({ id })
      .assign(data)
      .write();
  }

  /**
   * @param {string} id
   */
  remove(id) {
    if (!id) {
      throw new Error("id is undefined");
    }

    InMemoryCache.remove(this._name, this._table, { id });

    this._db.get(this._table)
      .remove({ id })
      .write();
  }

  _initCache() {
    if (InMemoryCache.isLoaded(this._name, this._table)) return;
    const data = this._db.get(this._table).value();
    InMemoryCache.load(this._name, this._table, data);
  }
}
