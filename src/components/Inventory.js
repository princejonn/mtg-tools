import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallCacheService";
import InventoryReader from "utils/InventoryReader";
import TimerMessage from "utils/TimerMessage";

export default class Inventory {
  constructor(file) {
    this._file = file;
  }

  async main() {
    const timerMessage = new TimerMessage("importing inventory");
    await ScryfallCacheService.load();
    const fileContent = await InventoryReader(this._file);
    const { amountSaved, uniqueCards } = await InventoryService.saveInventory(fileContent);
    console.log(`saved [ ${uniqueCards} ] unique cards to database - total amount [ ${amountSaved} ]`);
    timerMessage.done();
  }
}
