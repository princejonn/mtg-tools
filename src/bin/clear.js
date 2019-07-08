import os from "os";
import fs from "fs";
import path from "path";
import Spinners from "utils/Spinners";

export default () => {
  try {
    Spinners.start("clearing cache");

    fs.unlinkSync(path.join(os.homedir(), ".mtg-tools", "cache"));
    fs.unlinkSync(path.join(os.homedir(), ".mtg-tools", "db"));
    fs.unlinkSync(path.join(os.homedir(), ".mtg-tools", "reports"));

    Spinners.succeed();
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
