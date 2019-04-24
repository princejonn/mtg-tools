const _ = require('lodash');
const puppeteer = require('./puppeteer');
const countSimilarCards = require('./count-similar-cards');
const saveSortedResult = require('./save-sorted-result');

(async () => {
  try {
    const argv = process.argv.slice(2);

    if (argv[1]) {
      throw new Error('commander name needs to be added as first argument inside "quotation marks".');
    }

    let list = [];

    const commander = argv[0].toString().toLowerCase().replace(' ', '-');
    const edhRecCards = await puppeteer.edhRec(`https://edhrec.com/commanders/${commander}`);
    const tappedOutCards = await puppeteer.searchTappedOut(commander);

    list = list.concat(edhRecCards);
    list = list.concat(tappedOutCards);

    console.log(' counting cards...');
    const cards = countSimilarCards(list);

    console.log(' saving result...');
    saveSortedResult(commander, cards);

    process.exit(0);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
