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
 * @param {string} inventory
 * @param {string} top
 * @param {boolean} forceLogin
 * @returns {Promise<void>}
 */
export default async ({ url, theme, budget, hubs, inventory, top, forceLogin }) => {
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
    const inventoryChoice = await InquiryService.selectInventory(inventory);
    const topChoice = await InquiryService.selectTopDeck(top);
    const hubsChoice = await InquiryService.selectHubs(hubs);

    const tm1 = new TimerMessage("improving deck");
    const recommendation = await EDHRecService.getRecommendation(themeChoice);
    const linkList = await TappedOutService.getSimilarLinks({
      commander,
      budget: budgetChoice,
      top: topChoice,
      hubs: hubsChoice,
    });

    for (const link of linkList.links) {
      const { url, position } = link;
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      deck.setPosition({ position });
      decks.push(deck);
    }

    const cmdDeck = await TappedOutService.getCommanderDeck(commander, account);

    tm1.done();

    const tm2 = new TimerMessage("finalizing deck");
    const commanderDeck = new CommanderDeck({ inventoryChoice });
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    commanderDeck.calculate();

    tm2.done();

    await ReporterService.buildImproveReport({
      commander,
      commanderDeck,
      budgetChoice,
      themeChoice,
      inventoryChoice,
      topChoice,
      hubsChoice,
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};
