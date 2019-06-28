import Inventory from "components/Inventory";

(async () => {
  try {
    const argv = process.argv.slice(2);
    const file = argv[0];
    const inventory = new Inventory(file);
    await inventory.main();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
