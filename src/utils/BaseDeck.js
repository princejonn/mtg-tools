import cloneDeep from "lodash/cloneDeep";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import isNumber from "lodash/isNumber";
import isObject from "lodash/isObject";
import isString from "lodash/isString";
import InventoryService from "services/InventoryService";
import ScryfallService from "services/ScryfallService";

export default class BaseDeck {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    this._cards = [];
    this._tappedOut = { added: 0 };

    this._cmc = {
      average: {},
      commander: {},
      total: {},
    };
    this._colors = {
      average: {},
      commander: {},
      total: {},
    };
    this._types = {
      average: {},
      commander: {},
      total: {},
      add: {},
      remove: {},
    };

    this._calculated = {
      cmc: false,
      colors: false,
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
  async _calculateCmc() {
    if (this._calculated.cmc) return;

    this._averageFromPathTotal("_cmc");

    this._calculated.cmc = true;
  }

  /**
   * @returns {Promise<void>}
   * @protected
   */
  async _calculateColors() {
    if (this._calculated.colors) return;

    this._averageFromPathTotal("_colors");

    this._calculated.colors = true;
  }

  /**
   * @returns {Promise<void>}
   * @protected
   */
  async _calculateTypes() {
    if (this._calculated.types) return;

    this._averageFromPathTotal("_types");

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

      await this._addCmcAmount(card, data, isCommander);
      await this._addColorsAmount(card, data, isCommander);
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
   * @param {object} data
   * @param {boolean} [isCommander]
   * @returns {Promise<void>}
   * @private
   */
  async _addCmcAmount(card, data, isCommander) {
    if (!isObject(data.tappedOut)) return;
    if (!isNumber(card.cmc)) return;

    const path = isCommander === true ? "commander" : "total";
    const { cmc } = card;
    const { tappedOut } = data;
    const { amount } = tappedOut;
    const key = `${cmc}`;

    this._addKeyToPath(key, "_cmc");
    this._cmc[path][key] += amount;
  }

  /**
   * @param {Card} card
   * @param {object} data
   * @param {boolean} [isCommander]
   * @returns {Promise<void>}
   * @private
   */
  async _addColorsAmount(card, data, isCommander) {
    if (!isObject(data.tappedOut)) return;
    if (!isArray(card.colors)) return;

    const path = isCommander === true ? "commander" : "total";
    const { colors } = card;
    const { tappedOut } = data;
    const { amount } = tappedOut;

    for (const key of colors) {
      this._addKeyToPath(key, "_colors");
      this._colors[path][key] += amount;
    }
  }

  /**
   * @param {Card} card
   * @param {object} data
   * @param {boolean} [isCommander]
   * @returns {Promise<void>}
   * @private
   */
  async _addTypesAmount(card, data, isCommander) {
    if (!isObject(data.tappedOut)) return;
    if (!isString(card.type)) return;

    const path = isCommander === true ? "commander" : "total";
    const { type } = card;
    const { tappedOut } = data;
    const { amount } = tappedOut;
    const key = type;

    this._addKeyToPath(key, "_types");
    this._types[path][key] += amount;
  }

  /**
   * @param {string} key
   * @param {string} path
   * @private
   */
  _addKeyToPath(key, path) {
    if (!this[path].average[key]) {
      this[path].average[key] = 0;
    }
    if (!this[path].commander[key]) {
      this[path].commander[key] = 0;
    }
    if (!this[path].total[key]) {
      this[path].total[key] = 0;
    }
  }

  /**
   * @param {string} path
   * @private
   */
  _averageFromPathTotal(path) {
    for (const key in this[path].total) {
      if (!this[path].total.hasOwnProperty(key)) continue;
      this[path].average[key] = Math.floor(this[path].total[key] / this._tappedOut.added);
    }
  }
}
