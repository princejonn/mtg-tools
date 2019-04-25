module.exports = sortedCards => {
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
