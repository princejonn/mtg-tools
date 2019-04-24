const _ = require('lodash');
const puppeteer = require('./puppeteer');
const countSimilarCards = require('./count-similar-cards');
const saveSortedResult = require('./save-sorted-result');

(async () => {
  try {
    const fileName = process.argv[2];

    if (_.includes(fileName, 'http')) {
      throw new Error('first arg should be fileName');
    }

    const argv = process.argv.slice(3);
    let list = [];

    for (const arg of argv) {
      console.log(` getting cards from: ${arg}`);

      if (_.includes(arg, 'tappedout')) {
        const array = await puppeteer.tappedOut(arg);
        list = list.concat(array);
      }
      if (_.includes(arg, 'edhrec')) {
        const array = await puppeteer.edhRec(arg);
        list = list.concat(array);
      }
    }

    console.log(' counting cards...');
    const cards = countSimilarCards(list);

    console.log(' saving result...');
    saveSortedResult(fileName, cards);

    process.exit(0);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
