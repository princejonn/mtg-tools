
const dotenv = require("dotenv");
const _ = require("lodash");
const ArraySort = require("./lib/utils/ArraySort");
const TappedOutAccount = require("./lib/models/TappedOutAccount");
const EDHRecTheme = require("./lib/models/EDHRecTheme");
const TappedOutService = require("./lib/services/TappedOutService");
const EDHRecService = require("./lib/services/EDHRecService");
const ReadLineService = require("./lib/services/ReadLineService");

(async () => {
  try {
    dotenv.config();

    const cmdrUrl = "http://tappedout.net/mtg-decks/17-04-19-Tpb-yuriko-the-tigers-shadow/";
    const account = new TappedOutAccount(process.env.TAPPEDOUT_USERNAME, process.env.TAPPEDOUT_PASSWORD);

    const commander = await TappedOutService.getCommander(cmdrUrl, account);
    //const deck1 = await TappedOutService.getCommanderDeck(commander, account);
    //const links = await TappedOutService.getSimilarLinks(commander);
    //const deck2 = await TappedOutService.getSimilarDeck("https://tappedout.net/mtg-decks/precon-vela-gang-leader-rogues-ninjas/");
    const themeList = await EDHRecService.getThemes(commander);
    const theme = new EDHRecTheme(themeList.themes[0]);
    //const recommendation = await EDHRecService.getRecommendation(theme);

    const selectedTheme = await ReadLineService.selectTheme(themeList);

    console.log(selectedTheme);

  } catch (err) {
    console.log(err);
  } finally {
    process.exit(0);
  }
})();
