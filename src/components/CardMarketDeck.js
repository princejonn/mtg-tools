import filter from "lodash/filter";
import BaseDeck from "utils/BaseDeck";

export default class CardMarketDeck extends BaseDeck {
  constructor(options = {}) {
    super(options);

    this._calculated.all = false;

    this.cardsToPurchase = null;
  }

  async calculate() {
    if (this._calculated.all) return;

    await this._setCardsToPurchase();

    this._calculated.all = true;
  }

  async _setCardsToPurchase() {
    const cards = filter(this._cards, card => { return card.tappedOut.amount > card.inventory.amount; });

    for (const card of cards) {
      card.calculateMissing();
    }

    this.cardsToPurchase = cards;
  }
}
