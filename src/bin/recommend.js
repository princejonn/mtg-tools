import CommanderDeck from "components/CommanderDeck";
import Commander from "models/Commander";
import EDHRecService from "services/EDHRecService";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import TimerMessage from "utils/TimerMessage";

/**
 * @param {string} name
 * @param {string} theme
 * @param {string} budget
 * @param {string} hubs
 * @returns {Promise<void>}
 */
export default async ({ name, theme, budget, hubs, onlyInventory }) => {
  try {
    await ScryfallService.load();
    await InventoryService.load();

    const decks = [];

    const commander = new Commander({ name });

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

    tm1.done();

    const tm2 = new TimerMessage("finalizing deck");
    const commanderDeck = new CommanderDeck({ onlyInventory });
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    tm2.done();

    await ReporterService.buildRecommendReport(commander, commanderDeck);

    let quicker = `mtg-tools r "${name}"`;
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
