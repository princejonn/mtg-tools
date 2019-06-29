import adapter from "utils/NeDBAdapter";
import Collection from "enums/Collection";

export { Collection };

export default class NeDB {
  /**
   * @param {string} collection
   */
  constructor(collection) {
    this._collection = collection;
  }

  /**
   * @param {object} [options]
   * @param {object} [options.sort]
   * @param {number} [options.limit]
   * @returns {Promise<Array<object>>}
   */
  async get(options = {}) {
    return adapter.find(this._collection, {
      query: {},
      sort: options.sort,
      limit: options.limit,
    });
  }

  /**
   * @param {object} query
   * @param {object} [options]
   * @param {object} [options.sort]
   * @param {number} [options.limit]
   * @returns {Promise<Array<object>|object>}
   */
  async find(query, options = {}) {
    const result = await adapter.find(this._collection, {
      query,
      sort: options.sort,
      limit: options.limit,
    });

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
