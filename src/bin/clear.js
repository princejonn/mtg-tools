import fs from "fs";
import path from "path";
import Spinners from "utils/Spinners";

export default () => {
  try {
    Spinners.start("clearing cache");

    fs.unlinkSync(path.join(process.env.PWD, "cache"));
    fs.unlinkSync(path.join(process.env.PWD, "db"));
    fs.unlinkSync(path.join(process.env.PWD, "reports"));

    Spinners.succeed();
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
