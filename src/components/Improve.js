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
    const commanderData = await TappedOutService.getCommander(this.url, this.account);
    const commander = new Commander(commanderData);

    const themeListData = await EDHRecService.getThemes(commander);
    const themeList = new EDHRecThemeList(themeListData);

    const themeData = await ReadLineService.selectTheme(themeList);
    const theme = new EDHRecTheme(themeData);

    const recommendationData = await EDHRecService.getRecommendation(theme);
    const recommendation = new EDHRecRecommendation(recommendationData);

    const coDeckData = await TappedOutService.getCommanderDeck(commander, this.account);
    const coDeck = new TappedOutDeck(coDeckData);

    const commanderDeck = new CommanderDeck(coDeck);

    const linkListData = await TappedOutService.getSimilarLinks(commander);
    const linkList = new TappedOutLinkList(linkListData);

    for (const link of linkList.links) {
      const toDeckData = await TappedOutService.getDeck(link);
      if (!toDeckData) continue;
      const toDeck = new TappedOutDeck(toDeckData);
      commanderDeck.addDeck(toDeck);
    }

    commanderDeck.addRecommendation(recommendation);

    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
