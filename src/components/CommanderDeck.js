import cloneDeep from "lodash/cloneDeep";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import arraySort, { SortBy } from "utils/ArraySort";
import InventoryService from "services/InventoryService";
import ScryfallCacheService from "services/ScryfallService";

export default class CommanderDeck {
  /**
   * @param {object} [options]
   * @param {boolean} [options.onlyInventory]
   */
  constructor(options = {}) {
    this.cards = [];
    this.types = {};
    this.tappedOut = {
      decks: [],
      added: 0,
      types: {},
    };
    this.averageTypes = {};
    this.typeSuggestion = {};
    this.isCalculated = false;
    this.onlyInventory = options.onlyInventory || false;
  }

  /**
   * @param {TappedOutDeck} deck
   */
  async addCommanderDeck(deck) {
    const { cards } = deck;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        throw new Error("trying to add more of the same card in a commander deck");
      }

      this._sumCardTypes(this.types, card, data.tappedOut);

      card.isCommander = true;
      card.setEDHRec(data.edhRec);
      card.addTappedOut(data.tappedOut);
      await this._addCard(card);
    }
  }

  /**
   * @param {TappedOutDeck} deck
   * @returns {Promise<void>}
   */
  async addTappedOutDeck(deck) {
    const { url, cards } = deck;
    const array = [];
    let similarity = 0;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      array.push({
        id: card.id,
        typeLine: card.typeLine,
        amount: data.tappedOut.amount,
      });

      this._sumCardTypes(this.tappedOut.types, card, data.tappedOut);

      if (existingCard) {
        existingCard.addTappedOut(data.tappedOut);
        similarity += 1;
        continue;
      }

      card.addTappedOut(data.tappedOut);
      await this._addCard(card);
    }

    similarity = Math.floor((similarity / (this.cards.length + cards.length)) * 1000) / 10;

    this.tappedOut.added += 1;
    this.tappedOut.decks.push({
      url,
      similarity,
      cards: array,
    });
  }

  /**
   * @param {EDHRecRecommendation} recommendation
   * @returns {Promise<void>}
   */
  async addEDHRecommendation(recommendation) {
    const { cards } = recommendation;

    for (const data of cards) {
      const card = await ScryfallCacheService.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        existingCard.setEDHRec(data.edhRec);
        continue;
      }

      card.setEDHRec(data.edhRec);
      await this._addCard(card);
    }
  }

  /**
   * @returns {Array<Card>}
   */
  getMostSuggestedCards() {
    this._calculate();

    const cards = this._filterCards(false);

    return arraySort(cards, "percent", SortBy.DESCENDING);
  }

  /**
   * @returns {Array<Card>}
   */
  getLeastPopularCardsInDeck() {
    this._calculate();

    const cards = this._filterCards(true);

    return arraySort(cards, "percent", SortBy.ASCENDING);
  }

  /**
   * @returns {object}
   */
  getTypedRecommendation() {
    this._calculate();

    let { cards } = this;
    if (this.onlyInventory) {
      cards = filter(cards, card => { return card.inventory.amount > 0; });
    }

    const sorted = arraySort(cards, "percent", SortBy.DESCENDING);
    const averageTypes = cloneDeep(this.averageTypes);
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

    return typesCards;
  }

  /**
   * @returns {object}
   */
  getCardsToAdd() {
    return this._getCardsTo("add", false, SortBy.DESCENDING);
  }

  /**
   * @returns {object}
   */
  getCardsToRemove() {
    return this._getCardsTo("remove", true, SortBy.ASCENDING);
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
    this.cards.push(card);
  }

  /**
   * @param {string} addRemove
   * @param {boolean} inDeck
   * @param {string} sortBy
   * @private
   */
  _getCardsTo(addRemove, inDeck, sortBy) {
    this._calculate();

    const typeSuggestion = cloneDeep(this.typeSuggestion);
    const suggestion = typeSuggestion[addRemove];
    const filtered = this._filterCards(inDeck);
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
   * @private
   */
  _calculate() {
    if (this.isCalculated) return;

    for (const card of this.cards) {
      card.calculatePercent(this.tappedOut.added);
    }

    const types = {};

    for (const key in this.tappedOut.types) {
      if (!this.tappedOut.types.hasOwnProperty(key)) continue;
      types[key] = Math.floor(this.tappedOut.types[key] / this.tappedOut.added);
    }

    const add = {};
    const remove = {};

    for (const key in types) {
      if (!types.hasOwnProperty(key)) continue;
      if (!this.types[key]) {
        this.types[key] = 0;
      }
      const diff = types[key] - this.types[key];
      if (diff > 0) {
        add[key] = diff;
      } else if (diff < 0) {
        remove[key] = -diff;
      }
    }

    this.typeSuggestion = { add, remove };
    this.averageTypes = types;
    this.isCalculated = true;
  }

  /**
   * @param {boolean} inDeck
   * @returns {Array}
   * @private
   */
  _filterCards(inDeck) {
    let cards = filter(this.cards, { isCommander: inDeck });

    if (this.onlyInventory) {
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
  _sumCardTypes(path, card, tappedOut) {
    const { type } = card;
    const { amount } = tappedOut;
    if (!path[type]) {
      path[type] = 0;
    }
    path[type] += amount;
  }
}
