const getCardHTML = card => {
  return (`<div class="card-container">
    <div class="card-image"><img class="card-image-img" src="${card.image}" alt="${card.name}"/></div>
    <div class="card-data">
        <div class="card-data-amount">amount <span>${card.amount}</span></div>
        <div class="card-data-synergy">synergy <span>${card.synergy}%</span></div>
    </div>
</div>`);
};

export default async (commanderQueryString, deckList) => {
  const amount = 20;
  const addTheseCards = await deckList.getCardsNotInDeckByMostUsage();
  const removeTheseCards = await deckList.getCardsInDeckByLeastUsage();

  const addArray = [];
  const removeArray = [];

  for (let i = 0; i < amount; i++) {
    const card = addTheseCards[i];
    addArray.push(getCardHTML(card));
  }

  for (let i = 0; i < amount; i++) {
    const card = removeTheseCards[i];
    removeArray.push(getCardHTML(card));
  }

  return (`<html>
<head>
<link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet">
<style>
* {
  font-family: "Roboto", "Arial", sans-serif;
  margin: 0;
  padding: 0;
}
.card-list-header {
  font-size: 22pt;
  padding-top: 30px;
  padding-bottom: 5px;
  text-align: center;
}
.card-list {
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 10px;
}
.card-container {
  padding: 10px;
}
.card-image-img {
  width: 250px;
}
.card-data {
  display: flex;
  justify-content: space-between;
}
.card-data-amount {
  padding-right: 10px;
  padding-left: 10px;
  font-size: 11pt;
}
.card-data-amount span {
  font-weight: bold;
}
.card-data-synergy {
  padding-right: 10px;
  padding-left: 10px;
  font-size: 11pt;
}
.card-data-synergy span {
  font-weight: bold;
}
</style>
<title>report-${commanderQueryString}</title>
</head>
<body>
    <header class="card-list-header">Consider adding these cards</header>
    <section class="card-list">${addArray.join("")}</section>
    <header class="card-list-header">Consider removing these cards</header>
    <section class="card-list">${removeArray.join("")}</section>
</body>
</html>`);
};
