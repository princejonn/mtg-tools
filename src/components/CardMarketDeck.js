import filter from "lodash/filter";
import find from "lodash/find";
import BaseDeck from "utils/BaseDeck";

export default class CardMarketDeck extends BaseDeck {
  constructor(options = {}) {
    super(options);

    this.cardsToPurchase = null;
    this.decksToPurchase = null;
  }

  async calculate() {
    if (this._calculated.all) return;

    await this._setCardsToPurchase();
    await this._setDecksToPurchase();

    this._calculated.all = true;
  }

  async _setCardsToPurchase() {
    const cards = filter(this._cards, card => (card.tappedOut.amount > card.inventory.amount));

    for (const card of cards) {
      card.calculateMissing();
    }

    this.cardsToPurchase = cards;
  }

  async _setDecksToPurchase() {
    this.decksToPurchase = [];

    for (const deck of this._tappedOut.decks) {
      const url = deck.url;
      const cards = [];

      for (const card of deck.cards) {
        const found = find(this.cardsToPurchase, { id: card.id });
        if (!found) continue;
        cards.push(found.simpleName);
      }

      this.decksToPurchase.push({ url, cards });
    }
  }
}
