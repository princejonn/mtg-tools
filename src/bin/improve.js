import find from "lodash/find";
import includes from "lodash/includes";
import isString from "lodash/isString";
import CommanderDeck from "components/CommanderDeck";
import BudgetList from "enums/BudgetList";
import AccountService from "services/AccountService";
import EDHRecService from "services/EDHRecService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallCacheService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import InquiryService from "services/InquiryService";
import TimerMessage from "utils/TimerMessage";

/**
 * @returns {Promise<TappedOutAccount>}
 */
const getAccount = async () => {
  let account = await AccountService.get();

  if (!account) {
    console.log("you need to log in for this program to work");
    await AccountService.login();
  }

  account = await AccountService.get();

  return account;
};

/**
 * @param {string} theme
 * @param {Commander} commander
 * @returns {Promise<EDHRecTheme>}
 */
const getTheme = async (theme, commander) => {
  let choice;

  if (isString(theme)) {
    const themeList = await EDHRecService.getThemeList(commander);
    choice = find(themeList, { num: parseInt(theme, 10) });
  } else {
    choice = await InquiryService.selectTheme(commander);
  }

  return choice;
};

/**
 * @param {string} budget
 * @returns {Promise<TappedOutBudget>}
 */
const getBudget = async (budget) => {
  let choice;

  if (isString(budget)) {
    choice = find(BudgetList, { num: parseInt(budget, 10) });
  } else {
    choice = await InquiryService.selectBudget();
  }

  return choice;
};

/**
 * @param {string} hubs
 * @returns {Promise<string>}
 */
const getHubs = async (hubs) => {
  let choice;

  if (isString(hubs)) {
    choice = hubs;
  } else {
    choice = await InquiryService.selectHubs();
  }

  return choice;
};

/**
 * @param url
 * @param onlyInventory
 * @param theme
 * @param hubs
 * @param budget
 * @returns {Promise<void>}
 */
export default async ({ url, onlyInventory, theme, budget, hubs }) => {
  try {
    if (!includes(url, "http")) {
      throw new Error("url undefined");
    }

    await ScryfallCacheService.load();
    await InventoryService.load();

    const decks = [];

    const account = await getAccount();

    const tm0 = new TimerMessage("finding deck");
    const commander = await TappedOutService.getCommander(url, account);

    const themeChoice = await getTheme(theme, commander);
    const budgetChoice = await getBudget(budget);
    const hubsChoice = await getHubs(hubs);

    tm0.done();

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
    quicker += ` -g ${budgetChoice.num}`;
    quicker += ` -t ${themeChoice.num}`;

    if (hubsChoice) {
      quicker += ` -b ${hubsChoice}`;
    }

    console.log(`to run this again quicker - copy and paste this into your command prompt:\n\n--> ${quicker}\n`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};
