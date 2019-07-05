import arraySort, { SortBy } from "utils/ArraySort";
import BaseDeck from "utils/BaseDeck";

export default class ImproveDeck extends BaseDeck {
  constructor(options = {}) {
    super(options);

    this._calculated.all = false;

    this.mostPopularCards = null;
    this.leastPopularCards = null;
    this.cardsToAdd = null;
    this.cardsToRemove = null;
  }

  //
  // Public
  //

  async calculate() {
    if (this._calculated.all) return;

    await super._calculatePercent();
    await super._calculateCmc();
    await super._calculateColors();
    await super._calculateTypes();

    await this._setMostPopularCards();
    await this._setLeastPopularCards();
    await this._setCardsToAdd();
    await this._setCardsToRemove();

    this._calculated.all = true;
  }

  //
  // Private
  //

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setMostPopularCards() {
    let cards = this._cards;

    cards = await this._filterCardsByCommanderDeck(cards, false);
    cards = await this._filterCardsByInventory(cards);
    cards = arraySort(cards, "percent", SortBy.DESCENDING);

    this.mostPopularCards = cards;
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setLeastPopularCards() {
    let cards = this._cards;

    cards = await this._filterCardsByCommanderDeck(cards, true);
    cards = arraySort(cards, "percent", SortBy.ASCENDING);

    this.leastPopularCards = cards;
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setCardsToAdd() {
    let cards = this._cards;

    cards = await this._filterCardsByCommanderDeck(cards, false);
    cards = await this._filterCardsByInventory(cards);
    cards = arraySort(cards, "percent", SortBy.DESCENDING);
    cards = await this._getCardsTo(cards, "add");

    this.cardsToAdd = cards;
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setCardsToRemove() {
    let cards = this._cards;

    cards = await this._filterCardsByCommanderDeck(cards, false);
    cards = arraySort(cards, "percent", SortBy.ASCENDING);
    cards = await this._getCardsTo(cards, "remove");

    this.cardsToRemove = cards;
  }
}
