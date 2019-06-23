import dotenv from "dotenv";
import Improve from "components/Improve";

(async () => {
  try {
    dotenv.config();
    const argv = process.argv.slice(2);
    const url = argv[0];
    const username = process.env.TAPPEDOUT_USERNAME;
    const password = process.env.TAPPEDOUT_PASSWORD;
    const improve = new Improve(url, username, password);
    await improve.main();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
