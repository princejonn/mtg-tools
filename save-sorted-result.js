const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const dateFns = require('date-fns');

module.exports = (fileName, cards) => {
  if (!_.isString(fileName)) {
    throw new Error('fileName must be string');
  }
  if (!_.isObject(cards)) {
    throw new Error('cards must be object');
  }

  const now = dateFns.format(new Date(), 'YYYY-MM-DDTHH_mm_ss');
  const results = path.join(__dirname, 'results');

  if (!fs.existsSync(results)) {
    fs.mkdirSync(results);
  }

  const file = path.join(results, `${fileName}-${now}.txt`);

  for (let key in cards) {
    if (!cards.hasOwnProperty(key)) continue;

    const amount = key.replace('a-','');

    fs.appendFileSync(file, `CARDS BEING USED [ ${amount} ] TIMES:\r\n\r\n`);
    for (let card of cards[key]) {
      fs.appendFileSync(file, `1x ${card}\r\n`);
    }
    fs.appendFileSync(file, `\r\n`);
  }

  console.log(` done\n file can be found in:\n\n ${file}\n`);
};
