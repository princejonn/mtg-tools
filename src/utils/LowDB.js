import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import DateFns from "utils/DateFns";

const Database = {
  EDHREC: "db-edhrec.json",
  SCRYFALL: "db-scryfall.json",
  TAPPED_OUT: "db-tappedout.json",
};

const Defaults = {
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
    this._table = table;
    this._db.defaults(defaults).write();
  }

  /**
   * @param {object} [query]
   */
  find(query) {
    if (!query) {
      return this._db.get(this._table)
        .value();
    }
    return this._db.get(this._table)
      .find(query)
      .value();
  }

  /**
   * @param {object} data
   */
  push(data) {
    if (!!this.find({ id: data.id })) {
      throw new Error(`a post with this id already exists: [ ${data.id} ]`);
    }
    this._db.get(this._table)
      .push({
        ...data,
        created: DateFns.now(),
        updated: DateFns.now(),
      })
      .write();
  }

  /**
   * @param {object} query
   * @param {object} data
   */
  assign(query, data) {
    if (!query) {
      throw new Error("query is undefined");
    }
    if (!data) {
      throw new Error("data is undefined");
    }
    if (!this.find({ id: data.id })) {
      throw new Error(`id could not be found in the database table: [ ${data.id} ]`);
    }
    this._db.get(this._table)
      .find(query)
      .assign({
        ...data,
        updated: DateFns.now(),
      })
      .write();
  }

  /**
   * @param {string} id
   */
  remove(id) {
    if (!id) {
      throw new Error("id is undefined");
    }
    if (!this.find({ id })) {
      throw new Error(`id could not be found in the database table: [ ${id} ]`);
    }
    this._db.get(this._table)
      .remove({ id })
      .write();
  }
}
