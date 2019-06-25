import adapter, { Collection } from "utils/NeDBAdapter";

export { Collection };

export default class NeDB {
  /**
   * @param {string} collection
   */
  constructor(collection) {
    this._collection = collection;
  }

  /**
   * @param {object} [sort]
   * @returns {Promise<Array<object>>}
   */
  async get(sort) {
    if (sort) {
      return adapter.findSort(this._collection, {}, sort);
    }
    return adapter.find(this._collection, {});
  }

  /**
   * @param {object} query
   * @param {object} [sort]
   * @returns {Promise<Array<object>|object>}
   */
  async find(query, sort) {
    let result = [];

    if (sort) {
      result = await adapter.findSort(this._collection, query, sort);
    } else {
      result = await adapter.find(this._collection, query);
    }

    if (!result.length) {
      return null;
    }

    if (result.length > 1) {
      return result;
    }

    return result[0];
  }

  /**
   * @param {object} data
   * @returns {Promise<void>}
   */
  async insert(data) {
    return adapter.insert(this._collection, data);
  }

  /**
   * @param {object} query
   * @param {object} data
   * @returns {Promise<void>}
   */
  async update(query, data) {
    return adapter.update(this._collection, query, data);
  }

  /**
   * @param {object} query
   * @returns {Promise<void>}
   */
  async remove(query) {
    return adapter.remove(this._collection, query);
  }
}
