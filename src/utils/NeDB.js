import adapter, { Collection } from "utils/NeDBAdapter";

export { Collection };

export default class NeDB {
  constructor(collection) {
    this._collection = collection;
  }

  async get() {
    return adapter.get(this._collection);
  }

  async find(query) {
    const result = await adapter.find(this._collection, query);
    if (!result.length) {
      return null;
    }
    if (result.length > 1) {
      return result;
    }
    return result[0];
  }

  async insert(data) {
    return adapter.insert(this._collection, data);
  }

  async update(query, data) {
    return adapter.update(this._collection, query, data);
  }

  async remove(query) {
    return adapter.remove(this._collection, query);
  }
}
