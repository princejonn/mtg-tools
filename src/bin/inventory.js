import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallService";
import InventoryReader from "utils/InventoryReader";
import TimerMessage from "utils/TimerMessage";

export default async (file, nameKey, amountKey) => {
  await ScryfallCacheService.load();

  const timerMessage = new TimerMessage("importing inventory");
  const fileContent = await InventoryReader(file, nameKey, amountKey);
  const { amountSaved, uniqueCards } = await InventoryService.saveInventory(fileContent);
  timerMessage.done();

  console.log(`\nsaved [ ${uniqueCards} ] unique cards to database - total amount [ ${amountSaved} ]`);
};
