import includes from "lodash/includes";
import CommanderDeck from "components/CommanderDeck";
import EDHRecService from "services/EDHRecService";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import TimerMessage from "utils/TimerMessage";

/**
 * @param {string} url
 * @param {string} theme
 * @param {string} budget
 * @param {string} hubs
 * @param {boolean} forceLogin
 * @param {boolean} onlyInventory
 * @returns {Promise<void>}
 */
export default async ({ url, theme, budget, hubs, forceLogin, onlyInventory }) => {
  try {
    if (!includes(url, "http")) {
      throw new Error("url undefined");
    }

    await ScryfallService.load();
    await InventoryService.load();

    const decks = [];

    const account = await InquiryService.loginAccount(forceLogin);
    const commander = await TappedOutService.getCommander(url, account);
    const themeChoice = await InquiryService.selectTheme(commander, theme);
    const budgetChoice = await InquiryService.selectBudget(budget);
    const hubsChoice = await InquiryService.selectHubs(hubs);

    const tm1 = new TimerMessage("improving deck");
    const recommendation = await EDHRecService.getRecommendation(themeChoice);
    const linkList = await TappedOutService.getSimilarLinks(commander, budgetChoice, hubsChoice);

    for (const link of linkList.links) {
      const deck = await TappedOutService.getDeck(link);
      if (!deck) continue;
      decks.push(deck);
    }

    const cmdDeck = await TappedOutService.getCommanderDeck(commander, account);

    tm1.done();

    const tm2 = new TimerMessage("finalizing deck");
    const commanderDeck = new CommanderDeck({ onlyInventory });
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    tm2.done();

    await ReporterService.buildImproveReport(commander, commanderDeck);

    let quicker = `mtg-tools i ${url}`;
    if (onlyInventory) quicker += " -e";
    quicker += ` -g ${budgetChoice.num}`;
    quicker += ` -t ${themeChoice.num}`;
    if (hubsChoice) quicker += ` -b ${hubsChoice}`;
    if (!hubsChoice) quicker += " -b \"\"";

    console.log(`to run this again quicker - copy and paste this into your command prompt:\n\n--> ${quicker}\n`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};
