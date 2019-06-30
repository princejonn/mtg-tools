/* eslint quotes: 0 */

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
  static getSuggestedCards(commanderDeck, maximum) {
    const cards = commanderDeck.getMostSuggestedCards();
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header font-large">Consider adding these cards</header>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @param {number} maximum
   * @returns {string}
   */
  static getLeastPopularCards(commanderDeck, maximum) {
    const cards = commanderDeck.getLeastPopularCardsInDeck();
    const array = HTMLService._buildCardsHTML(cards.slice(0, maximum));

    return (`<header class="card-list-header font-large">Consider removing these cards</header>
    <section class="card-list">${array.join("")}</section>`);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getTypedRecommendation(commanderDeck) {
    const suggestion = commanderDeck.getTypedRecommendation();
    return this._buildSuggestionHTML(suggestion, "Recommendation based on types");
  }

  /**
   * @param {Commander} commander
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getTypedRecommendationDeckList(commander, commanderDeck) {
    const suggestion = commanderDeck.getTypedRecommendation();
    return this._buildTypedDeckList(commander, suggestion);
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getCardsToAdd(commanderDeck) {
    const suggestion = commanderDeck.getCardsToAdd();
    return this._buildSuggestionHTML(suggestion, "Add the following cards to have correct types amount");
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getCardsToRemove(commanderDeck) {
    const suggestion = commanderDeck.getCardsToRemove();
    return this._buildSuggestionHTML(suggestion, "Remove the following cards to have correct types amount");
  }

  /**
   * @param {object} suggestion
   * @param {string} header
   * @returns {string}
   * @private
   */
  static _buildSuggestionHTML(suggestion, header) {
    const content = [];

    content.push(`<header class="card-list-header font-large">${header}</header>`);
    content.push(`<section class="card-list">`);

    for (const key in suggestion) {
      if (!suggestion.hasOwnProperty(key)) continue;
      const cards = suggestion[key];
      if (!cards.length) continue;
      for (const card of cards) {
        content.push(HTMLService._buildCardHTML(card));
      }
    }

    content.push("</section>");

    return content.join("");
  }

  /**
   * @param {Commander} commander
   * @param {object} suggestion
   * @returns {string}
   * @private
   */
  static _buildTypedDeckList(commander, suggestion) {
    const content = [];

    content.push(`<section class="deck-list">`);
    content.push(`<div class="deck-list-type">`);
    content.push(`<span class="deck-list-name">1x ${commander.name} *CMDR*<br/></span>`);
    content.push(`</div>`);

    for (const key in suggestion) {
      if (!suggestion.hasOwnProperty(key)) continue;
      const cards = suggestion[key];
      if (!cards.length) continue;

      content.push(`<div class="deck-list-type">`);

      for (const card of cards) {
        const fontColor = card.inventory.amount > 0
          ? "green"
          : "red";

        content.push(`<span class="deck-list-name font-${fontColor}">1x ${card.name}<br/></span>`);
      }

      content.push(`</div>`);
    }

    content.push("</section>");

    return content.join("");
  }

  /**
   * @param {Array<Card>} cards
   * @returns Array<string>
   * @private
   */
  static _buildCardsHTML(cards) {
    const array = [];
    for (const card of cards) {
      array.push(HTMLService._buildCardHTML(card));
    }
    return array;
  }

  /**
   * @param {Card} card
   * @returns {string}
   * @private
   */
  static _buildCardHTML(card) {
    const borderColor = card.inventory.amount > 0
      ? "green"
      : "red";

    return (`
<div class="card-container" data-id="${card.id}">
  <div class="card-name">1x ${card.name}</div>
  <div class="card-image">
    <a href="${card.scryfallUri}" target="_blank">
      <img class="card-image-img" src="${card.image}" alt="${card.name}"/>
    </a>
  </div>
  <div class="card-border card-border-${borderColor}"></div>
  <div class="card-data">
    <div class="card-data-col">
      <div class="card-data-row font-large">${card.percent}%</div>
    </div>
    <div class="card-data-col">
      <div class="card-data-row font-small">EDHRec <span>${card.edhRec.percent}%</span></div>
      <div class="card-data-row font-small">TappedOut <span>${card.tappedOut.percent}%</span></div>
      <div class="card-data-row font-small">Inventory <span>${card.inventory.amount}</span></div>
    </div>
  </div>
</div>
`);
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
.card-name {
  display: block;
  color: darkgray;
  padding-bottom: 3px;
  font-size: 9pt;
  text-align: center;
}
.card-image-img {
  width: 250px;
}
.card-border {
  height: 4px;
}
.card-border-green {
  background-color: limegreen;
}
.card-border-red {
  background-color: red;
}
.card-data {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
}
.card-data-col {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  text-align: right;
}
.card-data-row {
  color: darkgray;
  padding-left: 5px;
  padding-right: 5px;
  justify-content: space-between;
}
.card-data-col span {
  font-weight: bold;
}
.deck-list {
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 10px;
}
.deck-list-type {
  width: 250px;
  padding: 10px;
  text-align: center;
}
.font-large {
  font-size: 23pt;
  font-weight: bold;
}
.font-medium {
  font-size: 15pt;
  font-weight: bold;
}
.font-small {
  font-size: 7pt;
}
.deck-list-name {
  font-size: 11pt;
}
.font-green {
  color: limegreen;
}
.font-red {
  color: red;
}
</style>`);
  }
}
