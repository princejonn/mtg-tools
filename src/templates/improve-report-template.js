const getCardHTML = card => {
  return (`<div class="card-container">
    <div class="card-image"><img class="card-image-img" src="${card.image}" alt="${card.name}"/></div>
    <div class="card-data">
        <div class="card-data-col">TappedOut <span>${card.tappedOutAmount}</span></div>
        <div class="card-data-col">EDHRec <span>${card.edhRecAmount}</span></div>
        <div class="card-data-col">Synergy <span>${card.synergy}%</span></div>
    </div>
</div>`);
};

export default async (commanderQueryString, deckList) => {
  const edhRecSuggestions = await deckList.getEDHRecSuggestions();
  const tappedOutSuggestions = await deckList.getTappedOutSuggestions();
  const leastUsedCardsInDeck = await deckList.getLeastUsedCardsInDeck();
  const mostSimilarDeck = await deckList.getMostSimilarDeck();

  const edhRecArray = [];
  const tappedOutArray = [];
  const removeArray = [];
  const similarArray = [];

  for (const card of edhRecSuggestions) {
    edhRecArray.push(getCardHTML(card));
  }

  for (const card of tappedOutSuggestions) {
    tappedOutArray.push(getCardHTML(card));
  }

  for (const card of leastUsedCardsInDeck) {
    removeArray.push(getCardHTML(card));
  }

  for (const card of mostSimilarDeck.cards) {
    similarArray.push(getCardHTML(card));
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
.card-data-col {
  padding-right: 10px;
  padding-left: 10px;
  font-size: 11pt;
}
.card-data-col span {
  font-weight: bold;
}* {
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
.card-list-header-sub {
  font-size: 16pt;
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
.card-data-col {
  color: darkgray;
  padding-right: 8px;
  padding-left: 8px;
  font-size: 8pt;
}
.card-data-col span {
  font-weight: bold;
}
</style>
<title>report-${commanderQueryString}</title>
</head>
<body>
    <header class="card-list-header">Suggestions from EDHRec</header>
    <section class="card-list">${edhRecArray.join("")}</section>
    <header class="card-list-header">Suggestions from TappedOut</header>
    <section class="card-list">${tappedOutArray.join("")}</section>
    <header class="card-list-header">Consider removing these cards</header>
    <section class="card-list">${removeArray.join("")}</section>
    <header class="card-list-header">Suggestions from most similar deck (${mostSimilarDeck.similarity}%)</header>
    <div class="card-list-header-sub"><a href="${mostSimilarDeck.link}" target="_blank">link</a></div>
    <section class="card-list">${similarArray.join("")}</section>
</body>
</html>`);
};
