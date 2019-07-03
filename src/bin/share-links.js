import ShareLinkService from "services/ShareLinkService";
import Spinners from "utils/Spinners";

export default async (urls) => {
  try {
    Spinners.start("saving links");
    for (const url of urls) {
      await ShareLinkService.save(url);
    }
    Spinners.succeed();
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
