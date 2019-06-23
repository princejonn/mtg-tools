import { includes } from "lodash";
import CommanderDeck from "models/CommanderDeck";
import TappedOutAccount from "models/TappedOutAccount";
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
    const commander = await TappedOutService.getCommander(this.url, this.account);
    const themeList = await EDHRecService.getThemeList(commander);
    const theme = await ReadLineService.selectTheme(themeList);
    const recommendation = await EDHRecService.getRecommendation(theme);
    const coDeck = await TappedOutService.getCommanderDeck(commander, this.account);
    const linkList = await TappedOutService.getSimilarLinks(commander);

    const commanderDeck = new CommanderDeck(coDeck);

    for (const link of linkList.links) {
      const toDeck = await TappedOutService.getDeck(link);
      if (!toDeck) continue;
      commanderDeck.addDeck(toDeck);
    }

    commanderDeck.addRecommendation(recommendation);

    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
