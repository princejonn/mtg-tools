const _ = require("lodash");
const puppeteer = require("../lib/puppeteer");
const countSimilarCards = require("../lib/count-similar-cards");
const saveSortedResult = require("../lib/save-sorted-result");

(async () => {
  try {
    const argv = process.argv.slice(2);

    if (!_.includes(argv[0], "http")) {
      throw new Error("link to deck needs to be supplied as first argument")
    }

    let cardList = [];

    console.log("getting primary deck information");
    const { commander, currentDeck, deckLinks } = await puppeteer.improveCommanderDeck(argv[0]);

    console.log("getting EDHREC cards");
    const edhRecCards = await puppeteer.edhRec(`https://edhrec.com/commanders/${commander}`);
    cardList = cardList.concat(edhRecCards);

    console.log("searching through tappedOut links");
    for (const link of deckLinks) {
      const cards = await puppeteer.tappedOut(link);
      cardList = cardList.concat(cards);
    }

    console.log("counting cards...");
    const cardsWithAmount = countSimilarCards(cardList);

    console.log("comparing cards to current deck");

    const unusedCards = [];

    for (let card of cardsWithAmount) {
      if (_.includes(currentDeck, card.name)) continue;
      unusedCards.push(card);
    }

    console.log("saving result...");
    saveSortedResult(`${commander}-unused`, unusedCards);

    process.exit(0);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
