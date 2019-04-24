const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const dateFns = require('date-fns');
const puppeteer = require('./puppeteer');
const cleanMagic = require('./clean-magic');
const compareSort = require('./compare-sort');

(async () => {
  const fileName = process.argv[2];

  if (_.includes(fileName, 'http')) {
    throw new Error('first arg should be fileName');
  }

  const argv = process.argv.slice(3);
  let cards = [];
  let list = [];
  let popularityCards = {};

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

  for (let item of list) {
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

  for (let obj of sortedCards) {
    const key = `a-${obj.amount}`;
    if (!popularityCards[key]) {
      popularityCards[key] = [];
    }
    popularityCards[key].push(obj.name);
  }

  console.log(' saving result...');

  const results = path.join(__dirname, 'results');

  if (!fs.existsSync(results)) {
    fs.mkdirSync(results);
  }

  const now = dateFns.format(new Date(), 'YYYY-MM-DDTHH_mm_ss');
  const file = path.join(results, `${fileName}-${now}.txt`);

  for (let key in popularityCards) {
    if (!popularityCards.hasOwnProperty(key)) continue;

    const amount = key.replace('a-','');

    fs.appendFileSync(file, `CARDS BEING USED [ ${amount} ] TIMES:\r\n\r\n`);
    for (let card of popularityCards[key]) {
      fs.appendFileSync(file, `1x ${card}\r\n`);
    }
    fs.appendFileSync(file, `\r\n`);
  }

  console.log(` done\n file can be found in:\n\n ${file}\n`);

  process.exit(0);
})();
