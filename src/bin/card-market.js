import includes from "lodash/includes";
import isString from "lodash/isString";
import CardMarketDeck from "components/CardMarketDeck";
import InquiryService from "services/InquiryService";
import InventoryService from "services/InventoryService";
import ScryfallService from "services/ScryfallService";
import ShareLinkService from "services/ShareLinkService";
import TappedOutService from "services/TappedOutService";
import ReporterService from "services/ReporterService";
import Spinners from "utils/Spinners";

export default async (urls) => {
  const links = [];
  const decks = [];
  const options = {
    loginRequired: false,
    account: null,
  };

  try {
    Spinners.start("preparing");

    for (let url of urls) {
      if (!includes(url, "tappedout.net/mtg-decks/")) {
        throw new Error("url incorrect. only tappedout decks currently allowed");
      }

      const shareLink = await ShareLinkService.getOrSet(url);

      if (isString(shareLink.link)) {
        links.push(shareLink.link);
      } else {
        links.push(url);
        options.loginRequired = true;
      }
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

    Spinners.next("finding decks");
    for (const url of links) {
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      decks.push(deck);
    }

    Spinners.next("building deck");
    const cardMarketDeck = new CardMarketDeck();
    for (const deck of decks) {
      await cardMarketDeck.addTappedOutDeck(deck);
    }
    await cardMarketDeck.calculate();

    Spinners.succeed();

    await ReporterService.buildCardMarketReport(cardMarketDeck);
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
