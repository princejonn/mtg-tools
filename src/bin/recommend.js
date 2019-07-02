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
 * @param {string} inventory
 * @param {string} top
 * @param {string} cards
 * @returns {Promise<void>}
 */
export default async ({ name, theme, budget, hubs, inventory, top, cards }) => {
  try {
    const tm1 = new TimerMessage("creating deck recommendation");

    await ScryfallService.load();
    await InventoryService.load();

    const decks = [];
    const commander = new Commander({ name });

    const themeChoice = await InquiryService.selectTheme(commander, theme);
    const budgetChoice = await InquiryService.selectBudget(budget);
    const inventoryChoice = await InquiryService.selectInventory(inventory);
    const topChoice = await InquiryService.selectTopDeck(top);
    const hubsChoice = await InquiryService.selectHubs(hubs);
    const cardsChoice = await InquiryService.selectCards(cards);

    const recommendation = await EDHRecService.getRecommendation(themeChoice);
    const linkList = await TappedOutService.getSimilarLinks({
      commander,
      budget: budgetChoice,
      top: topChoice,
      hubs: hubsChoice,
      cards: cardsChoice,
    });

    for (const link of linkList.links) {
      const { url, position } = link;
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      deck.setPosition({ position });
      decks.push(deck);
    }

    const tm2 = new TimerMessage("finalizing deck");
    const commanderDeck = new CommanderDeck({ inventoryChoice });
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    commanderDeck.calculate();

    tm1.done();
    tm2.done();

    await ReporterService.buildRecommendReport({
      commander,
      commanderDeck,
      budgetChoice,
      themeChoice,
      inventoryChoice,
      topChoice,
      hubsChoice,
      cardsChoice,
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};