const _ = require("lodash");
const puppeteer = require("../lib/puppeteer");
const countSimilarCards = require("../lib/count-similar-cards");
const saveSortedResult = require("../lib/save-sorted-result");

(async () => {
  try {
    const argv = process.argv.slice(2);

    if (argv[1]) {
      throw new Error("commander name needs to be added as first argument inside \"quotation marks\".");
    }

    let list = [];

    const name = argv[0];
    const commander = await puppeteer.findCommanderLinkByName(name);
    const edhRecCards = await puppeteer.edhRec(`https://edhrec.com/commanders/${commander}`);
    const tappedOutCards = await puppeteer.getPopularCommanderCards(commander);

    list = list.concat(edhRecCards);
    list = list.concat(tappedOutCards);

    console.log("counting cards...");
    const sortedCards = countSimilarCards(list);

    console.log("saving result...");
    saveSortedResult(commander, sortedCards);

    process.exit(0);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
