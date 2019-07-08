import os from "os";
import fs from "fs";
import path from "path";
import HTMLService from "services/HTMLService";
import DateFns from "utils/DateFns";

export default class ReporterService {
  /**
   * @param {CardMarketDeck} cardMarketDeck
   * @returns {Promise<void>}
   */
  static async buildCardMarketReport(cardMarketDeck) {
    const cwd = path.join(os.homedir(), ".mtg-tools", "reports");
    const now = DateFns.format(DateFns.get(), "YYYY-MM-DDTHH_mm_ss");

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd);
    }

    const file = path.join(cwd, `card-market-deck-list-${now}.txt`);

    for (const card of cardMarketDeck.cardsToPurchase) {
      fs.appendFileSync(file, `${card.inventory.missing}x ${card.simpleName}\r\n`);
    }

    console.log(`\nPaste this deck list into card market: --> ${file}\n`);
  }

  /**
   * @param {Commander} commander
   * @param {ImproveDeck} improveDeck
   * @returns {Promise<void>}
   */
  static async buildDifferenceReport({ commander, improveDeck }) {
    const content = [];

    content.push(HTMLService.getMostPopularCards(improveDeck, 100));
    content.push(HTMLService.getLeastPopularCards(improveDeck, 100));

    ReporterService._saveReport(commander, content, "difference");
  }

  /**
   * @param {Commander} commander
   * @param {ImproveDeck} improveDeck
   * @param {object} programOptions
   * @returns {Promise<void>}
   */
  static async buildImproveReport({ commander, improveDeck, ...programOptions }) {
    const content = [];

    const quicker = ReporterService._getQuickCommand(`i ${commander.url}`, programOptions);
    console.log(`\nto run this again - paste this:\n\n--> ${quicker}\n`);

    content.push(HTMLService.getQuickCommand(quicker));
    content.push(HTMLService.getMostPopularCards(improveDeck, 32));
    content.push(HTMLService.getLeastPopularCards(improveDeck, 24));
    content.push(HTMLService.getCardsToAdd(improveDeck));
    content.push(HTMLService.getCardsToRemove(improveDeck));

    ReporterService._saveReport(commander, content, "improve");
  }

  /**
   * @param {Commander} commander
   * @param {RecommendDeck} recommendDeck
   * @param {object} programOptions
   * @returns {Promise<void>}
   */
  static async buildRecommendReport({ commander, recommendDeck, ...programOptions }) {
    const content = [];

    const quicker = ReporterService._getQuickCommand(`r "${commander.name}"`, programOptions);
    console.log(`\nTo run this again: --> ${quicker}\n`);

    content.push(HTMLService.getQuickCommand(quicker));
    content.push(HTMLService.getTypedRecommendationDeckList(commander, recommendDeck));
    content.push(HTMLService.getTypedRecommendation(recommendDeck));

    ReporterService._saveReport(commander, content, "recommend");
  }

  /**
   * @param {string} reportType
   * @param {Commander} commander
   * @returns {string}
   * @private
   */
  static _getFile(commander, reportType) {
    const cwd = path.join(os.homedir(), ".mtg-tools", "reports");
    const now = DateFns.format(DateFns.get(), "YYYY-MM-DDTHH_mm_ss");

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
