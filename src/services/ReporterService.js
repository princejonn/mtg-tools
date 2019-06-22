import fs from "fs";
import path from "path";
import logger from "logger";
import HTMLService from "services/HTMLService";
import DateFns from "utils/DateFns";

export default class ReporterService {
  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @returns {Promise<void>}
   */
  static async buildImproveReport(commander, commanderDeck) {
    const pwd = process.env.PWD;
    const cwd = path.join(pwd, "reports");
    const now = DateFns.format(DateFns.get(), "YYYY-MM-DDTHH_mm_ss");

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd);
    }

    const content = [];
    content.push(HTMLService.getRecommendation(commanderDeck, 16));
    content.push(HTMLService.getPopular(commanderDeck, 16));
    content.push(HTMLService.getMostSimilar(commanderDeck, 12));
    content.push(HTMLService.getLeastPopular(commanderDeck, 12));

    const file = path.join(cwd, `improve-${commander.queryString}-${now}.html`);
    const html = HTMLService.buildReportHTML(commander, content);

    fs.appendFileSync(file, html);

    logger.debug("report generated", file);
    console.log(`report can be found in:\n\n-->  ${file}  <--\n`);
  }
}
