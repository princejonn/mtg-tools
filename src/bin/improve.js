import includes from "lodash/includes";
import isObject from "lodash/isObject";
import isString from "lodash/isString";
import CommanderDeck from "components/CommanderDeck";
import EDHRecService from "services/EDHRecService";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import ShareLinkService from "services/ShareLinkService";
import TappedOutService from "services/TappedOutService";
import Spinners from "utils/Spinners";

/**
 * @param {string} url
 * @param {string} theme
 * @param {string} budget
 * @param {string} hubs
 * @param {string} inventory
 * @param {string} top
 * @param {string} cards
 * @param {boolean} forceLogin
 * @returns {Promise<void>}
 */
export default async ({ url, theme, budget, hubs, inventory, top, cards, forceLogin }) => {
  const decks = [];
  const options = {
    loginRequired: true,
    account: null,
  };

  try {
    if (!includes(url, "https://tappedout.net/mtg-decks/")) {
      throw new Error("url incorrect. only tappedout decks currently allowed");
    }

    Spinners.start("preparing");
    const shareLink = await ShareLinkService.getOrSet(url);
    if (isObject(shareLink) && isString(shareLink.link)) {
      options.loginRequired = false;
      url = shareLink.link;
    }
    Spinners.succeed();

    if (options.loginRequired) {
      options.account = await InquiryService.loginAccount(forceLogin);
    }

    Spinners.start("loading cache");
    await ScryfallService.load();
    Spinners.succeed();

    Spinners.start("loading inventory");
    await InventoryService.load();
    Spinners.succeed();

    Spinners.start("finding commander");
    const commander = await TappedOutService.getCommander(url, options.account);
    Spinners.succeed();

    const themeChoice = await InquiryService.selectTheme(commander, theme);
    const budgetChoice = await InquiryService.selectBudget(budget);
    const inventoryChoice = await InquiryService.selectInventory(inventory);
    const topChoice = await InquiryService.selectTopDeck(top);
    const hubsChoice = await InquiryService.selectHubs(hubs);
    const cardsChoice = await InquiryService.selectCards(cards);

    Spinners.start("finding commander deck");
    const cmdDeck = await TappedOutService.getCommanderDeck(url, options.account);
    Spinners.succeed();

    Spinners.start("building recommendation");
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
    Spinners.succeed();

    Spinners.start("finalizing deck");
    const commanderDeck = new CommanderDeck({ inventoryChoice });
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addEDHRecommendation(recommendation);
    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }
    await commanderDeck.calculate();
    Spinners.succeed();

    await ReporterService.buildImproveReport({
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
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
};
