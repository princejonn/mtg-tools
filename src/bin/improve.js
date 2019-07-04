import includes from "lodash/includes";
import isObject from "lodash/isObject";
import isString from "lodash/isString";
import ImproveDeck from "components/ImproveDeck";
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
    Spinners.start("preparing");

    if (!includes(url, "tappedout.net/mtg-decks/")) {
      throw new Error("url incorrect. only tappedout decks currently allowed");
    }

    const shareLink = await ShareLinkService.getOrSet(url);

    if (isObject(shareLink) && isString(shareLink.link)) {
      options.loginRequired = false;
      url = shareLink.link;
    }

    if (options.loginRequired) {
      options.account = await InquiryService.loginAccount(forceLogin);

      Spinners.next("logging in");
      await TappedOutService.login(options.account);
    }

    Spinners.next("loading cache");
    await ScryfallService.load();

    Spinners.next("loading inventory");
    await InventoryService.load();

    Spinners.next("finding commander");
    const commander = await TappedOutService.getCommander(url);

    const themeChoice = await InquiryService.selectTheme(commander, theme);
    const budgetChoice = await InquiryService.selectBudget(budget);
    const inventoryChoice = await InquiryService.selectInventory(inventory);
    const topChoice = await InquiryService.selectTopDeck(top);
    const hubsChoice = await InquiryService.selectHubs(hubs);
    const cardsChoice = await InquiryService.selectCards(cards);

    Spinners.next("finding commander deck");
    const cmdDeck = await TappedOutService.getDeck(url);

    Spinners.next("finding edh-recommendation");
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
    for (const link of linkList.links) {
      const { url, position } = link;
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      deck.setPosition({ position });
      decks.push(deck);
    }

    Spinners.next("building deck");
    const improveDeck = new ImproveDeck({ inventoryChoice });
    await improveDeck.addCommanderDeck(cmdDeck);
    await improveDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await improveDeck.addTappedOutDeck(deck);
    }

    await improveDeck.calculate();

    Spinners.succeed();

    await ReporterService.buildImproveReport({
      commander,
      improveDeck,
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
