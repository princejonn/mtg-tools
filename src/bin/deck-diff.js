import includes from "lodash/includes";
import isString from "lodash/isString";
import ImproveDeck from "components/ImproveDeck";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import ShareLinkService from "services/ShareLinkService";
import TappedOutService from "services/TappedOutService";
import Spinners from "utils/Spinners";
import isObject from "lodash/isObject";

export default async (urls) => {
  const options = {
    loginRequired: true,
    account: null,
  };

  let url = urls[0];
  let comparison = urls[1];

  try {
    Spinners.start("preparing");

    if (!includes(url, "tappedout.net/mtg-decks/")) {
      throw new Error("url incorrect. only tappedout decks currently allowed");
    }
    if (!includes(comparison, "tappedout.net/mtg-decks/")) {
      throw new Error("comparison incorrect. only tappedout decks currently allowed");
    }

    const shareLink = await ShareLinkService.getOrSet(url);
    if (isObject(shareLink) && isString(shareLink.link)) {
      options.loginRequired = false;
      url = shareLink.link;
    }

    if (options.loginRequired) {
      options.account = await InquiryService.loginAccount();

      Spinners.next("logging in");
      await TappedOutService.login(options.account);
    }

    Spinners.next("loading cache");
    await ScryfallService.load();

    Spinners.next("loading inventory");
    await InventoryService.load();

    Spinners.next("finding commander");
    const commander = await TappedOutService.getCommander(url);

    Spinners.next("finding commander deck");
    const cmdDeck = await TappedOutService.getDeck(url, false);

    Spinners.next("finding comparison deck");
    const deck = await TappedOutService.getDeck(comparison, false);
    deck.setPosition({ position: 0 });

    Spinners.next("finalizing deck");
    const improveDeck = new ImproveDeck();
    await improveDeck.addCommanderDeck(cmdDeck);
    await improveDeck.addTappedOutDeck(deck);
    await improveDeck.calculate();

    Spinners.succeed();

    await ReporterService.buildDifferenceReport({
      commander,
      improveDeck,
    });
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
