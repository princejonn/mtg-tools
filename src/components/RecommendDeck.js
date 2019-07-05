import arraySort, { SortBy } from "utils/ArraySort";
import BaseDeck from "utils/BaseDeck";

export default class RecommendDeck extends BaseDeck {
  constructor(options = {}) {
    super(options);

    this._calculated.all = false;

    this.typedRecommendation = null;
  }

  /**
   * @returns {Promise<void>}
   */
  async calculate() {
    if (this._calculated.all) return;

    await super._calculatePercent();
    await super._calculateCmc();
    await super._calculateColors();
    await super._calculateTypes();

    await this._setTypedRecommendation();

    this._calculated.all = true;
  }

  //
  // Private
  //

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setTypedRecommendation() {
    let cards = this._cards;

    cards = await this._filterCardsByInventory(cards);
    cards = arraySort(cards, "percent", SortBy.DESCENDING);
    cards = await this._getCardsTo(cards, "average");

    this.typedRecommendation = cards;
  }
}
