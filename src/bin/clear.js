import fs from "fs";
import path from "path";

export default () => {
  fs.unlinkSync(path.join(process.env.PWD, "cache"));
  fs.unlinkSync(path.join(process.env.PWD, "db"));
  fs.unlinkSync(path.join(process.env.PWD, "reports"));
}
