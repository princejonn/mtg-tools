import cloneDeep from "lodash/cloneDeep";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import isUndefined from "lodash/isUndefined";
import arraySort, { SortBy } from "utils/ArraySort";
import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallService";

export default class CommanderDeck {
  /**
   * @param {object} [options]
   * @param {ProgramInventoryChoice} [options.inventoryChoice]
   */
  constructor(options = {}) {
    this._cards = [];
    this._types = {};
    this._tappedOut = {
      added: 0,
      types: {},
    };
    this._averageTypes = {};
    this._typeSuggestion = {};
    this._isCalculated = false;
    this._inventoryChoice = options.inventoryChoice || {};
    this._onlyInventory = this._inventoryChoice.value || false;

    this.mostSuggestedCards = null;
    this.leastPopularCardsInDeck = null;
    this.typedRecommendation = null;
    this.cardsToAdd = null;
    this.cardsToRemove = null;
    this.cardsToPurchase = null;
  }

  /**
   * @param {TappedOutDeck} deck
   */
  async addCommanderDeck(deck) {
    const { cards } = deck;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this._cards, { id: card.id });

      if (existingCard) {
        throw new Error("trying to add more of the same card in a commander deck");
      }

      await this._sumCardTypes(this._types, card, data.tappedOut);

      card.isCommander = true;
      card.addEDHRec(data.edhRec);
      card.addTappedOut(data.tappedOut);
      await this._addCard(card);
    }
  }

  /**
   * @param {TappedOutDeck} deck
   * @returns {Promise<void>}
   */
  async addTappedOutDeck(deck) {
    const { cards, position } = deck;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this._cards, { id: card.id });

      await this._sumCardTypes(this._tappedOut.types, card, data.tappedOut);

      if (existingCard) {
        existingCard.addTappedOut(data.tappedOut);
        existingCard.setPosition({ position });
        continue;
      }

      card.addTappedOut(data.tappedOut);
      card.setPosition({ position });
      await this._addCard(card);
    }

    this._tappedOut.added += 1;
  }

  /**
   * @param {EDHRecRecommendation} recommendation
   * @returns {Promise<void>}
   */
  async addEDHRecommendation(recommendation) {
    const { cards } = recommendation;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this._cards, { id: card.id });

      if (existingCard) {
        existingCard.addEDHRec(data.edhRec);
        continue;
      }

      card.addEDHRec(data.edhRec);
      await this._addCard(card);
    }
  }

  async calculate() {
    if (this._isCalculated) return;

    for (const card of this._cards) {
      card.calculatePercent(this._tappedOut.added);
    }

    const types = {};

    for (const key in this._tappedOut.types) {
      if (!this._tappedOut.types.hasOwnProperty(key)) continue;
      types[key] = Math.floor(this._tappedOut.types[key] / this._tappedOut.added);
    }

    const add = {};
    const remove = {};

    for (const key in types) {
      if (!types.hasOwnProperty(key)) continue;
      if (!this._types[key]) {
        this._types[key] = 0;
      }
      const diff = types[key] - this._types[key];
      if (diff > 0) {
        add[key] = diff;
      } else if (diff < 0) {
        remove[key] = -diff;
      }
    }

    this._typeSuggestion = { add, remove };
    this._averageTypes = types;

    await this._setMostSuggestedCards();
    await this._setLeastPopularCardsInDeck();
    await this._setTypedRecommendation();
    await this._setCardsToAdd();
    await this._setCardsToRemove();
    await this._setCardsToPurchase();

    this._isCalculated = true;
  }

  async _setMostSuggestedCards() {
    const cards = await this._filterCards(false);
    this.mostSuggestedCards = arraySort(cards, "percent", SortBy.DESCENDING);
  }

  async _setLeastPopularCardsInDeck() {
    const cards = await this._filterCards(true);
    this.leastPopularCardsInDeck = arraySort(cards, "percent", SortBy.ASCENDING);
  }

  async _setTypedRecommendation() {
    const cards = await this._filterCards();
    const sorted = arraySort(cards, "percent", SortBy.DESCENDING);
    const averageTypes = cloneDeep(this._averageTypes);
    const typesCards = {};

    for (const typeKey in averageTypes) {
      if (!averageTypes.hasOwnProperty(typeKey)) continue;

      if (!typesCards[typeKey]) {
        typesCards[typeKey] = [];
      }

      for (const index in sorted) {
        if (!sorted.hasOwnProperty(index)) continue;
        if (averageTypes[typeKey] === 0) break;

        const card = sorted[index];
        if (card.type !== typeKey) continue;

        typesCards[typeKey].push(card);

        sorted.splice(index, 1);
        averageTypes[typeKey] -= 1;
      }
    }

    this.typedRecommendation = typesCards;
  }

  async _setCardsToAdd() {
    this.cardsToAdd = await this._getCardsTo("add", false, SortBy.DESCENDING);
  }

  async _setCardsToRemove() {
    this.cardsToRemove = await this._getCardsTo("remove", true, SortBy.ASCENDING);
  }

  async _setCardsToPurchase() {
    this.cardsToPurchase = [];
  }

  /**
   * @param {Card} card
   * @private
   */
  async _addCard(card) {
    if (includes(card.type, "basic")) return;
    if (includes(card.type, "snow")) return;
    const amount = await InventoryService.getAmount(card.id);
    card.setInventory({ amount });
    this._cards.push(card);
  }

  /**
   * @param {string} addRemove
   * @param {boolean} inDeck
   * @param {string} sortBy
   * @private
   */
  async _getCardsTo(addRemove, inDeck, sortBy) {
    const typeSuggestion = cloneDeep(this._typeSuggestion);
    const suggestion = typeSuggestion[addRemove];
    const filtered = await this._filterCards(inDeck);
    const sorted = arraySort(filtered, "percent", sortBy);
    const typedCards = {};

    for (const type in suggestion) {
      if (!suggestion.hasOwnProperty(type)) continue;
      if (type === "basicLand") continue;

      if (!typedCards[type]) {
        typedCards[type] = [];
      }

      for (const index in sorted) {
        if (!sorted.hasOwnProperty(index)) continue;
        if (suggestion[type] === 0) break;

        const card = sorted[index];
        if (card.type !== type) continue;

        typedCards[type].push(card);

        sorted.splice(index, 1);
        suggestion[type] -= 1;
      }
    }

    return typedCards;
  }

  /**
   * @param {boolean} [inDeck]
   * @returns {Array}
   * @private
   */
  async _filterCards(inDeck) {
    let cards = this._cards;

    if (!isUndefined(inDeck)) {
      cards = filter(cards, { isCommander: inDeck });
    }

    if (this._onlyInventory) {
      cards = filter(cards, card => { return card.inventory.amount > 0; });
    }

    return cards;
  }

  /**
   * @param {object} path
   * @param {Card} card
   * @param {object} tappedOut
   * @private
   */
  async _sumCardTypes(path, card, tappedOut) {
    const { type } = card;
    const { amount } = tappedOut;
    if (!path[type]) {
      path[type] = 0;
    }
    path[type] += amount;
  }
}
