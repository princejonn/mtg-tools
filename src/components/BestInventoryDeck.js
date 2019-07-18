import InventoryService from "services/InventoryService";
import BaseDeck from "utils/BaseDeck";

export default class BestInventoryDeck extends BaseDeck {
  constructor(options = {}) {
    super(options);

    this.bestAmount = 0;
    this.bestInventoryDeck = null;
  }

  async calculate() {
    if (this._calculated.all) return;

    await this._setBestInventoryDeck();

    this._calculated.all = true;
  }

  /**
   * @private
   */
  async _setBestInventoryDeck() {
    const decks = this._tappedOut.decks;

    for (const deck of decks) {
      const amount = await BestInventoryDeck._getDeckInventoryAmount(deck);
      if (amount <= this.bestAmount) continue;
      this.bestAmount = amount;
      this.bestInventoryDeck = deck;
    }
  }

  /**
   * @param {TappedOutDeck} deck
   * @returns {number}
   * @private
   */
  static async _getDeckInventoryAmount(deck) {
    let inventoryAmount = 0;

    for (const card of deck.cards) {
      const amount = await InventoryService.getAmount(card.id);
      if (amount < 1) continue;

      inventoryAmount += 1;
    }

    return inventoryAmount;
  }
}
