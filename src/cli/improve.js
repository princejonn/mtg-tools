import dotenv from "dotenv";
import logger from "logger";
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
    logger.error(err);
  } finally {
    process.exit(0);
  }
})();
