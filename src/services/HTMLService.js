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
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getTypedSuggestion(commanderDeck) {
    const suggestion = commanderDeck.getTypedSuggestion();
    return this._buildSuggestionHTML(suggestion, "Recommendation based on types");
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getCardsToAdd(commanderDeck) {
    const suggestion = commanderDeck.getCardsToAdd();
    return this._buildSuggestionHTML(suggestion, "Add the following cards");
  }

  /**
   * @param {CommanderDeck} commanderDeck
   * @returns {string}
   */
  static getCardsToRemove(commanderDeck) {
    const suggestion = commanderDeck.getCardsToRemove();
    return this._buildSuggestionHTML(suggestion, "Remove the following cards");
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

    for (const key in suggestion) {
      if (!suggestion.hasOwnProperty(key)) continue;
      const cards = suggestion[key];
      if (!cards.length) continue;
      content.push(`<header class="card-list-header font-medium">${key.replace(/\_/g, " ").toUpperCase()}</header>`);
      content.push("<section class=\"card-list\">");
      for (const card of cards) {
        content.push(HTMLService._buildCardHTML(card));
      }
      content.push("</section>");
    }

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
.card-border {
  height: 5px;
}
.card-border-green {
  background-color: limegreen;
}
.card-border-red {
  background-color: red;
}
.card-image-img {
  width: 250px;
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
</style>`);
  }
}
