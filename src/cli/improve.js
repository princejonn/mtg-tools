import dotenv from "dotenv";
import logger from "logger";
import Improve from "components/Improve";

(async () => {
  try {
    dotenv.config();
    const argv = process.argv.slice(2);
    const username = process.env.TAPPEDOUT_USERNAME;
    const password = process.env.TAPPEDOUT_PASSWORD;
    console.log("under construction");
    //const improve = new Improve(argv[0], username, password);
    //await improve.run();
  } catch (err) {
    logger.error(err);
  } finally {
    process.exit(0);
  }
})();
