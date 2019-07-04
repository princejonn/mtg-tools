import cloneDeep from "lodash/cloneDeep";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import isObject from "lodash/isObject";
import InventoryService from "services/InventoryService";
import ScryfallService from "services/ScryfallService";

export default class BaseDeck {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    this._cards = [];
    this._tappedOut = { added: 0 };
    this._types = {
      commander: {},
      average: {},
      total: {},
      add: {},
      remove: {},
    };
    this._calculated = {
      percent: false,
      types: false,
    };
    this._options = options;
  }

  //
  // Abstract
  //

  /**
   * @returns {Promise<void>}
   * @abstract
   */
  async calculate() {
    throw new Error("this needs to be overloaded");
  }

  //
  // Public
  //

  /**
   * @param {TappedOutDeck} commanderDeck
   * @returns {Promise<void>}
   */
  async addCommanderDeck(commanderDeck) {
    const { cards } = commanderDeck;
    await this._addCards({ cards, isCommander: true });
    this._tappedOut.added += 1;
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   * @returns {Promise<void>}
   */
  async addTappedOutDeck(tappedOutDeck) {
    const { cards, position } = tappedOutDeck;
    await this._addCards({ cards, position });
    this._tappedOut.added += 1;
  }

  /**
   * @param {EDHRecRecommendation} recommendation
   * @returns {Promise<void>}
   */
  async addEDHRecommendation(recommendation) {
    const { cards } = recommendation;
    await this._addCards({ cards });
  }

  //
  // Protected
  //

  /**
   * @returns {Promise<void>}
   * @protected
   */
  async _calculatePercent() {
    if (this._calculated.percent) return;

    for (const card of this._cards) {
      card.calculatePercent(this._tappedOut.added);
    }

    this._calculated.percent = true;
  }

  /**
   * @returns {Promise<void>}
   * @protected
   */
  async _calculateTypes() {
    if (this._calculated.types) return;

    for (const type in this._types.total) {
      if (!this._types.total.hasOwnProperty(type)) continue;

      if (!this._types.average[type]) {
        this._types.average[type] = 0;
      }

      this._types.average[type] = Math.floor(this._types.total[type] / this._tappedOut.added);
    }

    for (const type in this._types.average) {
      if (!this._types.average.hasOwnProperty(type)) continue;

      const diff = this._types.commander[type] - this._types.average[type];
      if (diff > 0) {
        this._types.add[type] = diff;
      } else if (diff < 0) {
        this._types.remove[type] = -diff;
      }
    }

    this._calculated.types = true;
  }

  /**
   * @param {Array<Card>} cards
   * @param {boolean} inDeck
   * @returns {Promise<Array<Card>>}
   * @protected
   */
  async _filterCardsByCommanderDeck(cards, inDeck) {
    return filter(cards, card => { return card.isCommander === inDeck; });
  }

  /**
   * @param {Array<Card>} cards
   * @returns {Promise<Array<Card>>}
   * @protected
   */
  async _filterCardsByInventory(cards) {
    if (
      this._options &&
      this._options.inventoryChoice &&
      this._options.inventoryChoice.value
    ) {
      return filter(cards, card => { return card.inventory.amount > 0; });
    }
    return cloneDeep(cards);
  }

  /**
   * @param {Array<Card>} cards
   * @param {string} path
   * @returns {Promise<object>}
   * @protected
   */
  async _getCardsTo(cards, path) {
    const clone = cloneDeep(cards);
    const types = cloneDeep(this._types[path]);
    const typedCards = {};

    for (const type in types) {
      if (!types.hasOwnProperty(type)) continue;

      for (const index in clone) {
        if (!clone.hasOwnProperty(index)) continue;

        if (!typedCards[type]) {
          typedCards[type] = [];
        }

        if (types[type] === 0) break;

        const card = clone[index];
        if (card.type !== type) continue;

        typedCards[type].push(card);

        clone.splice(index, 1);
        types[type] -= 1;
      }
    }

    return typedCards;
  }

  //
  // Private
  //

  /**
   * @param {Array<Card>} cards
   * @param {number} [position]
   * @param {boolean} [isCommander]
   * @returns {Promise<void>}
   * @private
   */
  async _addCards({ cards, position, isCommander }) {
    for (const data of cards) {
      const card = await ScryfallService.getCard(data.id);

      if (includes(card.type, "basic")) continue;
      if (includes(card.type, "snow")) continue;

      const existingCard = find(this._cards, { id: data.id });
      const amount = await InventoryService.getAmount(data.id);

      await this._addTypesAmount(card, data, isCommander);

      if (existingCard) {
        existingCard.addEDHRec(data);
        existingCard.addTappedOut(data);
        existingCard.setCommander(isCommander);
        existingCard.setPosition(position);
        continue;
      }

      card.addEDHRec(data);
      card.addTappedOut(data);
      card.setCommander(isCommander);
      card.setInventory(amount);
      card.setPosition(position);

      this._cards.push(card);
    }
  }

  /**
   * @param {Card} card
   * @param {Card} data
   * @param {boolean} [isCommander]
   * @returns {Promise<void>}
   * @private
   */
  async _addTypesAmount(card, data, isCommander) {
    if (!isObject(data.tappedOut)) return;

    const { type } = card;
    const { tappedOut } = data;
    const { amount } = tappedOut;

    const path = isCommander === true ? "commander" : "total";

    if (!this._types.commander[type]) {
      this._types.commander[type] = 0;
    }

    if (!this._types.total[type]) {
      this._types.total[type] = 0;
    }

    this._types[path][type] += amount;
  }
}
