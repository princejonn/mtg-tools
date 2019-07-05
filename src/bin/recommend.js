import RecommendDeck from "components/RecommendDeck";
import Commander from "models/Commander";
import EDHRecService from "services/EDHRecService";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import Spinners from "utils/Spinners";

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
  const decks = [];

  try {
    Spinners.start("loading cache");

    await ScryfallService.load();

    Spinners.next("loading inventory");
    await InventoryService.load();

    Spinners.succeed();

    const commander = new Commander({ name });

    const themeChoice = await InquiryService.selectTheme(commander, theme);
    const budgetChoice = await InquiryService.selectBudget(budget);
    const inventoryChoice = await InquiryService.selectInventory(inventory);
    const topChoice = await InquiryService.selectTopDeck(top);
    const hubsChoice = await InquiryService.selectHubs(hubs);
    const cardsChoice = await InquiryService.selectCards(cards);

    Spinners.start("finding edh-recommendation");
    const recommendation = await EDHRecService.getRecommendation(themeChoice);

    Spinners.next("finding tapped-out links");
    const linkList = await TappedOutService.getSimilarLinks({
      commander,
      budget: budgetChoice,
      top: topChoice,
      hubs: hubsChoice,
      cards: cardsChoice,
    });

    Spinners.next("finding tapped-out decks");
    Spinners.setTotalTasks(linkList.links.length);
    for (const link of linkList.links) {
      Spinners.startTask();
      const { url, position } = link;
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      deck.setPosition({ position });
      decks.push(deck);
    }

    Spinners.next("building deck");
    const recommendDeck = new RecommendDeck({ inventoryChoice });
    await recommendDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await recommendDeck.addTappedOutDeck(deck);
    }

    await recommendDeck.calculate();

    Spinners.succeed();

    await ReporterService.buildRecommendReport({
      commander,
      recommendDeck,
      budgetChoice,
      themeChoice,
      inventoryChoice,
      topChoice,
      hubsChoice,
      cardsChoice,
    });
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
};
