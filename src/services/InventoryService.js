import ScryfallCacheService from "services/ScryfallCacheService";
import NeDB, { Collection } from "utils/NeDB";

class InventoryService {
  constructor() {
    this._db = new NeDB(Collection.INVENTORY);
  }

  /**
   * @param {string} id
   * @returns {Promise<number>}
   */
  async getAmount(id) {
    const exists = await this._db.find({ id });
    if (!exists) {
      return 0;
    }
    return exists.amount;
  }

  /**
   * @param {{[key]: number}} fileContent
   * @returns {Promise<{amountSaved: number, uniqueCards: number}>}
   */
  async saveInventory(fileContent) {
    await this._db.resetFile();

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
    const card = await ScryfallCacheService.find(name);
    if (!card.id) {
      console.warn(`card with [ ${name} ] not found in scryfall cache`);
      return;
    }
    await this._db.insert({ id: card.id, amount });
  }
}

const inventoryService = new InventoryService();

export default inventoryService;
