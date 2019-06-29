import fs from "fs";
import path from "path";
import HTMLService from "services/HTMLService";
import DateFns from "utils/DateFns";

export default class ReporterService {
  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @returns {Promise<void>}
   */
  static async buildImproveReport(commander, commanderDeck) {
    const content = [];

    content.push(HTMLService.getRecommendation(commanderDeck, 16));
    content.push(HTMLService.getLeastPopular(commanderDeck, 12));
    content.push(HTMLService.getCardsToAdd(commanderDeck));
    content.push(HTMLService.getCardsToRemove(commanderDeck));

    ReporterService._saveReport(commander, content, "improve");
  }

  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @returns {Promise<void>}
   */
  static async buildRecommendReport(commander, commanderDeck) {
    const content = [];

    content.push(HTMLService.getTypedSuggestion(commanderDeck));
    content.push(HTMLService.getTypedSuggestionDeckList(commanderDeck));
    content.push(HTMLService.getRecommendation(commanderDeck, 32));

    ReporterService._saveReport(commander, content, "recommend");
  }

  /**
   * @param {string} reportType
   * @param {Commander} commander
   * @returns {string}
   * @private
   */
  static _getFile(commander, reportType) {
    const cwd = path.join(process.env.PWD, "reports");
    const now = DateFns.format(DateFns.get(), "YYYY-MM-DDTHH_mm_ss");

    console.log("building report");

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd);
    }

    return path.join(cwd, `${reportType}-${commander.queryString}-${now}.html`);
  }

  /**
   * @param {string} reportType
   * @param {Commander} commander
   * @param {Array<string>} content
   * @private
   */
  static _saveReport(commander, content, reportType) {
    const file = ReporterService._getFile(commander, reportType);
    const html = HTMLService.buildReportHTML(commander, content);

    fs.appendFileSync(file, html);

    console.log(`\nRead your report in:\n\n--> ${file}\n`);
  }
}
