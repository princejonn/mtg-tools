export default class HTMLService {
  /**
   * @param {Commander} commander
   * @param {Array<string>} content
   * @returns {string}
   */
  static buildReportHTML(commander, content) {
    let html = "<html><head>";
    html += HTMLService._buildStyle();
    html += `<title>Report ${commander.name}</title></head><body>`;
    html += content.join("");
    html += "</body></html>";
    return html;
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @param {number} maximum
   * @returns {string}
   */
  static getRecommendation(commanderDeck, maximum) {
    const cards = commanderDeck.getMostRecommendedCards();
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header">Recommendation from EDHRec</header>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @param {number} maximum
   * @returns {string}
   */
  static getPopular(commanderDeck, maximum) {
    const cards = commanderDeck.getMostPopularCards();
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header">Suggestions from TappedOut</header>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @param {number} maximum
   * @returns {string}
   */
  static getLeastPopular(commanderDeck, maximum) {
    const cards = commanderDeck.getLeastPopularCardsInDeck();
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header">Consider removing these cards</header>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @param {number} maximum
   * @returns {string}
   */
  static getMostSimilar(commanderDeck, maximum) {
    const deck = commanderDeck.getMostSimilarDeck();
    const { url, cards, similarity } = deck;
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header">Most similar deck (${similarity}%)</header>
    <div class="card-list-header-sub"><a href="${url}" target="_blank">link</a></div>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {Array<Card>} cards
   * @returns Array<string>
   * @private
   */
  static _buildCardsHTML(cards) {
    const array = [];
    for (const card of cards) {
      array.push(`<div class="card-container" data-id="${card.id}"> 
    <div class="card-image"><img class="card-image-img" src="${card.image}" alt="${card.name}"/></div>
    <div class="card-data">
        <div class="card-data-col">TappedOut <span>${card.tappedOut.percent}%</span></div>
        <div class="card-data-col">EDHRec <span>${card.edhRec.percent}%</span></div>
    </div>
    <div class="card-data">
        <div class="card-data-col">TappedOut #<span>${card.tappedOut.amount}</span></div>
        <div class="card-data-col">EDHRec #<span>${card.edhRec.amount}</span></div>
    </div>
</div>`);
    }
    return array;
  }

  /**
   * @returns {string}
   * @private
   */
  static _buildStyle() {
    return (`<link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet">
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
</style>`);
  }
}
