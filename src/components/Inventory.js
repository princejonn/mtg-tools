import { includes } from "lodash";
import InventoryService from "services/InventoryService";
import InventoryReader from "utils/InventoryReader";
import TimerMessage from "utils/TimerMessage";

export default class Inventory {
  constructor(file) {
    if (!includes(file, ".txt")) {
      throw new Error("unsupported format. only [ .txt ] files allowed");
    }
    this._file = file;
  }

  async main() {
    const timerMessage = new TimerMessage("importing inventory");
    const fileContent = await InventoryReader(this._file);
    const { amountSaved, uniqueCards } = await InventoryService.saveInventory(fileContent);
    console.log(`saved [ ${uniqueCards} ] unique cards to database - total amount [ ${amountSaved} ]`);
    timerMessage.done();
  }
}
