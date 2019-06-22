import { includes } from "lodash";
import logger from "logger";
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
    logger.debug("getting commander");
    const commander = new Commander(await TappedOutService.getCommander(this.url, this.account));

    logger.debug("getting commander themes on EDHRec");
    const themeList = new EDHRecThemeList(await EDHRecService.getThemes(commander));

    logger.debug("awaiting input to select theme on EDHRec");
    const theme = new EDHRecTheme(await ReadLineService.selectTheme(themeList));

    logger.debug("getting recommendation from EDHRec");
    const recommendation = new EDHRecRecommendation(await EDHRecService.getRecommendation(theme));

    logger.debug("getting commander deck");
    const coDeck = new TappedOutDeck(await TappedOutService.getCommanderDeck(commander, this.account));

    logger.debug("creating commander deck");
    const commanderDeck = new CommanderDeck(coDeck);

    logger.debug("getting deck links from TappedOut");
    const linkList = new TappedOutLinkList(await TappedOutService.getSimilarLinks(commander));

    for (const link of linkList.links) {
      const toDeck = new TappedOutDeck(await TappedOutService.getDeck(link));
      logger.debug("adding deck", toDeck.url);
      commanderDeck.addDeck(toDeck);
    }

    logger.debug("adding recommendation", recommendation.url);
    commanderDeck.addRecommendation(recommendation);

    logger.debug("building report");
    await ReporterService.buildImproveReport(commander, commanderDeck);
  }
}
