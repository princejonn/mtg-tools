import fs from "fs";
import path from "path";

export default () => {
  fs.unlinkSync(path.join(process.cwd(), "cache"));
  fs.unlinkSync(path.join(process.cwd(), "db"));
  fs.unlinkSync(path.join(process.cwd(), "reports"));
}
