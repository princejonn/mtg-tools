import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallCacheService";
import InventoryReader from "utils/InventoryReader";
import TimerMessage from "utils/TimerMessage";

export default class Inventory {
  constructor(file) {
    this._file = file;
  }

  async main() {
    await ScryfallCacheService.load();

    const timerMessage = new TimerMessage("importing inventory");
    const fileContent = await InventoryReader(this._file);
    const { amountSaved, uniqueCards } = await InventoryService.saveInventory(fileContent);
    timerMessage.done();

    console.log(`\nsaved [ ${uniqueCards} ] unique cards to database - total amount [ ${amountSaved} ]`);
  }
}
