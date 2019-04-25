const encodeUrl = require('encodeurl');

const name = "Yuriko, the Tiger's Shadow";
const encoded = encodeUrl(`http://tappedout.net/mtg-cards/search/?name=${name}&o=name_sort&mana_cost=&mana_cost_converted_0=&mana_cost_converted_1=&rules=&subtype=&formats=&blocks=&rarity=`);

console.log(name);
console.log(encoded);
