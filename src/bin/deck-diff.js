import includes from "lodash/includes";
import Spinners from "../utils/Spinners";
import ShareLinkService from "../services/ShareLinkService";
import isObject from "lodash/isObject";
import isString from "lodash/isString";
import InquiryService from "../services/InquiryService";
import ScryfallService from "../services/ScryfallService";
import InventoryService from "../services/InventoryService";
import TappedOutService from "../services/TappedOutService";
import CommanderDeck from "../components/CommanderDeck";
import ReporterService from "../services/ReporterService";

export default async (urls) => {
  const options = {
    loginRequired: true,
    account: null,
  };

  let url = urls[0];
  let comparison = urls[1];

  try {
    if (!includes(url, "tappedout.net/mtg-decks/")) {
      throw new Error("url incorrect. only tappedout decks currently allowed");
    }
    if (!includes(comparison, "tappedout.net/mtg-decks/")) {
      throw new Error("comparison incorrect. only tappedout decks currently allowed");
    }

    Spinners.start("preparing");
    const shareLink = await ShareLinkService.getOrSet(url);
    if (isObject(shareLink) && isString(shareLink.link)) {
      options.loginRequired = false;
      url = shareLink.link;
    }
    Spinners.succeed();

    if (options.loginRequired) {
      options.account = await InquiryService.loginAccount();
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

    Spinners.start("finding commander deck");
    const cmdDeck = await TappedOutService.getCommanderDeck(url, options.account);
    Spinners.succeed();

    Spinners.start("finding comparison deck");
    const deck = await TappedOutService.getDeck(comparison);
    deck.setPosition({ position: 0 });
    Spinners.succeed();

    Spinners.start("finalizing deck");
    const commanderDeck = new CommanderDeck();
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addTappedOutDeck(deck);
    await commanderDeck.calculate();
    Spinners.succeed();

    await ReporterService.buildDifferenceReport({
      commander,
      commanderDeck,
    });
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
