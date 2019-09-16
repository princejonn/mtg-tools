import cloneDeep from "lodash/cloneDeep";
import filter from "lodash/filter";
import find from "lodash/find";
import arraySort, { SortBy } from "utils/ArraySort";
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

    this.cardsToPurchase = arraySort(cards, "inventory.missing", SortBy.DESCENDING);
  }

  async _setDecksToPurchase() {
    const cardsToPurchase = cloneDeep(this.cardsToPurchase);
    this.decksToPurchase = [];

    for (const deck of this._tappedOut.decks) {
      const url = deck.url;
      const cards = [];

      for (const card of deck.cards) {
        const found = find(cardsToPurchase, item => (item.id === card.id && item.inventory.missing > 0));
        if (!found) continue;
        cards.push(found.simpleName);
        found.inventory.missing -= 1;
      }

      this.decksToPurchase.push({ url, cards });
    }
  }
}
