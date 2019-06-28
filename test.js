const InventoryReader = require("./lib/utils/InventoryReader");
const NeDB = require("./lib/utils/NeDB");

(async () => {
  await InventoryReader("./test-file.txt");
  const nedb = new NeDB.default("inventory");
  await nedb.insert({ hej: 1, jonn: "jonn" });
  console.log(await nedb.find({ hej: 1 }));
  await nedb.resetFile();
  console.log(await nedb.get());
})();
