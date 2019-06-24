import { includes } from "lodash";
import CommanderDeck from "models/CommanderDeck";
import TappedOutAccount from "models/TappedOutAccount";
import EDHRec from "pages/EDHRec";
import TappedOut from "pages/TappedOut";
import ReadLineService from "services/ReadLineService";
import ReporterService from "services/ReporterService";

export default class Improve {
  constructor(url, username, password) {
    if (!includes(url, "http")) {
      throw new Error("url is undefined");
    }
    this.url = url;
    this.account = new TappedOutAccount(username, password);
  }

  async main() {
    const edhRec = new EDHRec();
    const tappedOut = new TappedOut();
    const decks = [];

    const commander = await tappedOut.getCommander(this.url, this.account);
    const themeList = await edhRec.getThemeList(commander);
    const theme = await ReadLineService.selectTheme(themeList);
    const recommendation = await edhRec.getRecommendation(theme);
    const linkList = await tappedOut.getSimilarLinks(commander);

    for (const link of linkList.links) {
      const deck = await tappedOut.getDeck(link);
      if (!deck) continue;
      decks.push(deck);
    }

    const cmdDeck = await tappedOut.getCommanderDeck(commander, this.account);

    console.log("finalizing deck");
    const commanderDeck = new CommanderDeck();
    await commanderDeck.addCommanderDeck(cmdDeck);
    await commanderDeck.addEDHRecommendation(recommendation);

    for (const deck of decks) {
      await commanderDeck.addTappedOutDeck(deck);
    }

    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
