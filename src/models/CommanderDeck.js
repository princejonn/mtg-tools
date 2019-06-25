import { cloneDeep, filter, find, includes } from "lodash";
import ArraySort, { SortBy } from "utils/ArraySort";
import ScryfallCache from "utils/ScryfallCache";

const Types = {
  artifact: 0,
  creature: 0,
  enchantment: 0,
  instant: 0,
  sorcery: 0,
  basicLands: 0,
  lands: 0,
};

export default class CommanderDeck {
  constructor() {
    this.cards = [];
    this.types = cloneDeep(Types);
    this.tappedOut = {
      decks: [],
      added: 0,
      types: cloneDeep(Types),
    };
    this.isCalculated = false;
  }

  /**
   * @param {TappedOutDeck} deck
   */
  async addCommanderDeck(deck) {
    const { cards } = deck;

    for (const data of cards) {
      const card = await ScryfallCache.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        throw new Error("trying to add more of the same card in a commander deck");
      }

      this._sumCardType(this.types, card, data);

      card.isCommander = true;
      card.setEDHRec(data.edhRec);
      card.addTappedOut(data.tappedOut);

      this.cards.push(card);
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
      const card = await ScryfallCache.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      array.push({
        id: card.id,
        typeLine: card.typeLine,
        amount: data.tappedOut.amount,
      });

      this._sumCardType(this.tappedOut.types, card, data);

      if (existingCard) {
        existingCard.addTappedOut(data.tappedOut);
        similarity += 1;
        continue;
      }

      card.addTappedOut(data.tappedOut);
      this.cards.push(card);
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
      const card = await ScryfallCache.getCard(data.id);
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        existingCard.setEDHRec(data.edhRec);
        continue;
      }

      card.setEDHRec(data.edhRec);
      this.cards.push(card);
    }
  }

  /**
   * @returns {Array<Card>}
   */
  getMostRecommendedCards() {
    this._calculate();

    const cards = filter(this.cards, { isCommander: false });

    return ArraySort.sortProperty(cards, "percent", SortBy.DESCENDING);
  }

  /**
   * @returns {Array<Card>}
   */
  getLeastPopularCardsInDeck() {
    this._calculate();

    const cards = filter(this.cards, { isCommander: true });

    return ArraySort.sortProperty(cards, "percent", SortBy.ASCENDING);
  }

  /**
   * @private
   */
  _calculate() {
    if (this.isCalculated) return;

    for (const card of this.cards) {
      card.calculatePercent(this.tappedOut.added);
    }

    const types = cloneDeep(Types);
    for (const key in types) {
      if (!types.hasOwnProperty(key)) continue;
      types[key] = Math.floor(this.tappedOut.types[key] / this.tappedOut.added);
    }

    this.averageTypes = types;
    this.isCalculated = true;
  }

  /**
   * @param {object} path
   * @param {Card} card
   * @param {object} data
   * @private
   */
  _sumCardType(path, card, data) {
    const typeLine = card.typeLine.toLowerCase();
    const { amount } = data.tappedOut;

    if (includes(typeLine, "artifact")) {
      path.artifact += amount;
    }
    if (includes(typeLine, "creature")) {
      path.creature += amount;
    }
    if (includes(typeLine, "enchantment")) {
      path.enchantment += amount;
    }
    if (includes(typeLine, "instant")) {
      path.instant += amount;
    }
    if (includes(typeLine, "sorcery")) {
      path.sorcery += amount;
    }
    if (includes(typeLine, "land") && includes(typeLine, "basic")) {
      path.basicLands += amount;
    }
    if (includes(typeLine, "land") && !includes(typeLine, "basic")) {
      path.lands += amount;
    }
  }
}
