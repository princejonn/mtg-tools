import { includes } from "lodash";
import Commander from "models/Commander";
import CommanderDeck from "models/CommanderDeck";
import EDHRecRecommendation from "models/EDHRecRecommendation";
import EDHRecTheme from "models/EDHRecTheme";
import EDHRecThemeList from "models/EDHRecThemeList";
import TappedOutAccount from "models/TappedOutAccount";
import TappedOutDeck from "models/TappedOutDeck";
import TappedOutLinkList from "models/TappedOutLinkList";
import EDHRecService from "services/EDHRecService";
import ReadLineService from "services/ReadLineService";
import ReporterService from "services/ReporterService";
import TappedOutService from "services/TappedOutService";

export default class Improve {
  constructor(url, username, password) {
    if (!includes(url, "http")) {
      throw new Error("url is undefined");
    }
    this.url = url;
    this.account = new TappedOutAccount(username, password);
  }

  async main() {
    console.log("getting commander");
    const commander = new Commander(await TappedOutService.getCommander(this.url, this.account));

    console.log("getting commander themes on EDHRec");
    const themeList = new EDHRecThemeList(await EDHRecService.getThemes(commander));

    console.log("awaiting input to select theme on EDHRec");
    const theme = new EDHRecTheme(await ReadLineService.selectTheme(themeList));

    console.log("getting recommendation from EDHRec");
    const recommendation = new EDHRecRecommendation(await EDHRecService.getRecommendation(theme));

    console.log("getting commander deck");
    const coDeck = new TappedOutDeck(await TappedOutService.getCommanderDeck(commander, this.account));

    console.log("creating commander deck");
    const commanderDeck = new CommanderDeck(coDeck);

    console.log("getting deck links from TappedOut");
    const linkList = new TappedOutLinkList(await TappedOutService.getSimilarLinks(commander));

    for (const link of linkList.links) {
      const toDeck = new TappedOutDeck(await TappedOutService.getDeck(link));
      console.log("adding deck", toDeck.url);
      commanderDeck.addDeck(toDeck);
    }

    console.log("adding recommendation", recommendation.url);
    commanderDeck.addRecommendation(recommendation);

    console.log("building report");
    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
