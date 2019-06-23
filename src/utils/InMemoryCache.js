import { find, findIndex } from "lodash";

class InMemoryCache {
  constructor() {
    this._cache = {};
    this._loadedIntoMemory = {};
  }

  /**
   * @param {string} database
   * @param {string} table
   * @param {Array<object>} dataArray
   */
  load(database, table, dataArray) {
    if (!this._cache[database]) {
      this._cache[database] = {};
    }
    if (!this._cache[database][table]) {
      this._cache[database][table] = [];
    }
    this._cache[database][table] = dataArray;
    this._loadedIntoMemory[`${database}:${table}`] = true;
  }

  /**
   * @param {string} database
   * @param {string} table
   * @returns {boolean}
   */
  isLoaded(database, table) {
    return !!this._loadedIntoMemory[`${database}:${table}`];
  }

  /**
   * @param {string} database
   * @param {string} table
   * @returns {array}
   */
  get(database, table) {
    return this._cache[database][table];
  }

  /**
   * @param {string} database
   * @param {string} table
   * @param {object} query
   * @returns {object}
   */
  find(database, table, query) {
    return find(this._cache[database][table], query);
  }

  /**
   * @param {string} database
   * @param {string} table
   * @param {object} data
   */
  push(database, table, data) {
    this._cache[database][table].push(data);
  }

  /**
   * @param {string} database
   * @param {string} table
   * @param {object|function} predicate
   * @param {object} data
   */
  assign(database, table, predicate, data) {
    const index = findIndex(this._cache[database][table], predicate);
    this._cache[database][table][index] = {
      ...this._cache[database][table][index],
      ...data,
    };
  }

  /**
   * @param {string} database
   * @param {string} table
   * @param {object|function} predicate
   */
  remove(database, table, predicate) {
    const index = findIndex(this._cache[database][table], predicate);
    this._cache[database][table].splice(index, 1);
  }
}

const cache = new InMemoryCache();

export default cache;
