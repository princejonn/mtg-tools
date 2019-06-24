export default class HTMLService {
  /**
   * @param {Commander} commander
   * @param {Array<string>} content
   * @returns {string}
   */
  static buildReportHTML(commander, content) {
    let html = "<html><head>";
    html += HTMLService._buildStyle();
    html += `<title>Report - ${commander.name}</title></head><body>`;
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

    return (`<header class="card-list-header font-large">Recommendation from EDHRec</header>
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

    return (`<header class="card-list-header font-large">Consider removing these cards</header>
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
<div class="card-image"><a href="${card.scryfallUri}" target="_blank"><img class="card-image-img" src="${card.image}" alt="${card.name}"/></a></div>
<div class="card-data"><div class="card-data-row">
<div class="card-data-col font-large">${card.percent}%</div></div><div class="card-data-row">
<div class="card-data-col font-small">TappedOut <span>${card.tappedOut.percent}%</span></div>
<div class="card-data-col font-small">EDHRec <span>${card.edhRec.percent}%</span></div></div></div></div>`);
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
  font-size: 10px;
  margin: 0;
  padding: 0;
}
.card-list-header {
  padding-top: 30px;
  padding-bottom: 5px;
  text-align: center;
}
.card-list-header-sub {
  padding-top: 20px;
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
  flex-direction: row;
}
.card-data-row {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  text-align: right;
}
.card-data-col {
  color: darkgray;
  padding-top: 3px;
  padding-bottom: 3px;
  padding-left: 9px;
  padding-right: 9px;
  justify-content: space-between;
}
.card-data-col span {
  font-weight: bold;
}
.font-large {
  font-size: 22pt;
  font-weight: bold;
}
.font-medium {
  font-size: 16pt;
}
.font-small {
  font-size: 8pt;
}
</style>`);
  }
}
