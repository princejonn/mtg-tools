import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallService";
import InventoryReader from "utils/InventoryReader";
import Spinners from "utils/Spinners";

export default async (file, nameKey, amountKey) => {
  Spinners.start("saving inventory");

  try {
    await ScryfallCacheService.load();
    const fileContent = await InventoryReader(file, nameKey, amountKey);
    const { amountSaved, uniqueCards } = await InventoryService.saveInventory(fileContent);

    Spinners.succeed(`saved [ ${uniqueCards} ] unique cards to database - total amount [ ${amountSaved} ]`);
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
};
