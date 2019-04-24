const cleanMagic = require('./clean-magic');
const compareSort = require('./compare-sort');

module.exports = listOfCards => {
  let cards = [];

  console.log(' counting cards...');

  for (let item of listOfCards) {
    const card = cleanMagic(item);
    if (!card) continue;
    let index = -1;

    for (let i in cards) {
      const object = cards[i];
      if (card === object.name) {
        index = parseInt(i);
      }
    }

    if (index !== -1) {
      cards[index].amount++;
    } else {
      cards.push({ name: card, amount: 1 });
    }
  }

  console.log(' sorting cards...');

  const sortedCards = compareSort(cards, 'amount', 'DESC');

  let popularityCards = {};

  for (let obj of sortedCards) {
    const key = `a-${obj.amount}`;
    if (!popularityCards[key]) {
      popularityCards[key] = [];
    }
    popularityCards[key].push(obj.name);
  }

  return popularityCards;
};
