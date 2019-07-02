import fs from "fs";
import path from "path";
import HTMLService from "services/HTMLService";
import DateFns from "utils/DateFns";

export default class ReporterService {
  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @param {object} programOptions
   * @returns {Promise<void>}
   */
  static async buildImproveReport({ commander, commanderDeck, ...programOptions }) {
    const content = [];

    const quicker = ReporterService._getQuickCommand(`i ${commander.url}`, programOptions);
    console.log(`\nto run this again - paste this:\n\n--> ${quicker}\n`);

    content.push(HTMLService.getQuickCommand(quicker));
    content.push(HTMLService.getSuggestedCards(commanderDeck, 32));
    content.push(HTMLService.getLeastPopularCards(commanderDeck, 24));
    content.push(HTMLService.getCardsToAdd(commanderDeck));
    content.push(HTMLService.getCardsToRemove(commanderDeck));

    ReporterService._saveReport(commander, content, "improve");
  }

  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @param {object} programOptions
   * @returns {Promise<void>}
   */
  static async buildRecommendReport({ commander, commanderDeck, ...programOptions }) {
    const content = [];

    const quicker = ReporterService._getQuickCommand(`r "${commander.name}"`, programOptions);
    console.log(`\nTo run this again: --> ${quicker}\n`);

    content.push(HTMLService.getQuickCommand(quicker));
    content.push(HTMLService.getTypedRecommendationDeckList(commander, commanderDeck));
    content.push(HTMLService.getTypedRecommendation(commanderDeck));
    content.push(HTMLService.getSuggestedCards(commanderDeck, 32));

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

    console.log(`\nTo read your report: --> ${file}\n`);
  }

  /**
   * @param {string} program
   * @param {{budgetChoice: object, themeChoice: object, inventoryChoice: object, topChoice: object, hubsChoice: string, cardsChoice: string}} programOptions
   * @returns {string}
   * @private
   */
  static _getQuickCommand(program, programOptions) {
    let quicker = `mtg-tools ${program}`;

    quicker += ` -g ${programOptions.budgetChoice.num}`;
    quicker += ` -t ${programOptions.themeChoice.num}`;
    quicker += ` -e ${programOptions.inventoryChoice.num}`;
    quicker += ` -p ${programOptions.topChoice.num}`;

    if (programOptions.hubsChoice) quicker += ` -b ${programOptions.hubsChoice}`;
    if (!programOptions.hubsChoice) quicker += " -b \"\"";

    if (programOptions.cardsChoice) quicker += ` -c ${programOptions.cardsChoice}`;
    if (!programOptions.cardsChoice) quicker += " -c \"\"";

    return quicker;
  }
}
