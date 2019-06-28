import ScryfallCacheService from "services/ScryfallCacheService";
import NeDB, { Collection } from "utils/NeDB";
import TimerMessage from "utils/TimerMessage";

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
    let uniqueCards = 0;
    let amountSaved = 0;

    const timerMessage = new TimerMessage("saving inventory to db");

    for (const key in fileContent) {
      if (!fileContent.hasOwnProperty(key)) continue;
      const name = key;
      const amount = fileContent[key];
      await this._saveItem(name, amount);
      uniqueCards += 1;
      amountSaved += amount;
    }

    timerMessage.done();

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

const inventoryService = new InventoryService();

export default inventoryService;
