import find from "lodash/find";
import ScryfallCacheService from "services/ScryfallService";
import NeDB, { Collection } from "utils/NeDB";

class InventoryService {
  constructor() {
    this._db = new NeDB(Collection.INVENTORY);
    this._cache = [];
    this._loaded = false;
  }

  /**
   * @param {string} id
   * @returns {Promise<number>}
   */
  async getAmount(id) {
    await this.load();

    const exists = find(this._cache, { id });
    if (!exists) {
      return 0;
    }

    return exists.amount;
  }

  /**
   * @returns {Promise<void>}
   */
  async load() {
    if (this._loaded) return;

    this._cache = await this._db.get();
    this._loaded = true;
  }

  /**
   * @param {{[key]: number}} fileContent
   * @returns {Promise<{amountSaved: number, uniqueCards: number}>}
   */
  async saveInventory(fileContent) {
    let uniqueCards = 0;
    let amountSaved = 0;

    for (const key in fileContent) {
      if (!fileContent.hasOwnProperty(key)) continue;
      const name = key;
      const amount = fileContent[key];
      await this._saveItem(name, amount);
      uniqueCards += 1;
      amountSaved += amount;
    }

    return { amountSaved, uniqueCards };
  }

  /**
   * @param {string} name
   * @param {number} amount
   * @returns {Promise<void>}
   * @private
   */
  async _saveItem(name, amount) {
    const { id } = await ScryfallCacheService.find(name);

    if (!id) {
      console.warn(`card with [ ${name} ] not found in scryfall cache`);
      return;
    }

    const exists = await this._db.find({ id });

    if (exists) {
      return this._db.update({ id }, { amount });
    }

    return this._db.insert({ id, amount });
  }
}

const service = new InventoryService();

export default service;
