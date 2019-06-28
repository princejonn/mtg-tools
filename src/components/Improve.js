import { includes } from "lodash";
import CommanderDeck from "components/CommanderDeck";
import TappedOutAccount from "models/TappedOutAccount";
import EDHRecService from "services/EDHRecService";
import ReadLineService from "services/ReadLineService";
import ReporterService from "services/ReporterService";
import TappedOutService from "services/TappedOutService";
import TimerMessage from "utils/TimerMessage";
import ScryfallCacheService from "../services/ScryfallCacheService";

export default class Improve {
  constructor(url, username, password) {
    if (!includes(url, "http")) {
      throw new Error("url is undefined");
    }
    this.url = url;
    this.account = new TappedOutAccount(username, password);
  }

  async main() {
    await ScryfallCacheService.load();

    const edhRec = new EDHRecService();
    const tappedOut = new TappedOutService();
    const decks = [];

    const commander = await tappedOut.getCommander(this.url, this.account);
    const themeList = await edhRec.getThemeList(commander);

    const tm1 = new TimerMessage("improving deck");
    const theme = await ReadLineService.selectTheme(themeList);
    const recommendation = await edhRec.getRecommendation(theme);
    const linkList = await tappedOut.getSimilarLinks(commander);

    for (const link of linkList.links) {
      const deck = await tappedOut.getDeck(link);
      if (!deck) continue;
      decks.push(deck);
    }

    const cmdDeck = await tappedOut.getCommanderDeck(commander, this.account);

    const tm2 = new TimerMessage("finalizing deck");
    const commanderDeck = new CommanderDeck();
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    tm2.done();
    tm1.done();
    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
