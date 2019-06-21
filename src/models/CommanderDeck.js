import { find } from "lodash";
import logger from "logger";
import ArraySort, { SortBy } from "utils/ArraySort";
import TappedOutDeck from "./TappedOutDeck";

export default class CommanderDeck {
  constructor() {
    this.deck = {
      cards: [],
    };
    this.edhRec = {
      cards: [],
    };
    this.tappedOut = {
      cards: [],
      decks: [],
      added: 0,
    };
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  addCommanderDeck(tappedOutDeck) {
    if (this.deck.cards.length) {
      throw new Error("you can only use addCommanderDeck once");
    }

    this.deck = tappedOutDeck;
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  addTappedOutDeck(tappedOutDeck) {
    for (const deck of this.tappedOut.decks) {
      if (tappedOutDeck.url !== deck.url) continue;
      throw new Error("you can only add a unique tappedOutDeck once");
    }

    this.tappedOut.added += 1;
    let similarity = 0;

    const { cards } = tappedOutDeck;

    logger.silly("adding new unique cards to tappedOut.cards");
    for (const card of cards) {
      const existing = find(this.tappedOut.cards, { id: card.id });
      if (existing) continue;
      this.tappedOut.cards.push(card);
    }

    logger.silly("adding similarity to this.deck");
    for (const card of cards) {
      const existing = find(this.deck.cards, { id: card.id });
      if (!existing) continue;
      similarity += 1;
    }

    logger.silly("calculating amount & percent on tappedOut.cards that exist in this tappedOutDeck");
    for (const card of this.tappedOut.cards) {
      const addedCard = find(cards, { id: card.id });
      if (!addedCard) continue;
      card.tappedOut.amount = card.tappedOut.amount + addedCard.tappedOut.amount;
      card.tappedOut.percent = ((card.tappedOut.amount / this.tappedOut.added) * 1000) / 10;
    }

    logger.silly("copying tappedOut object to all cards in this.deck");
    for (const card of this.deck.cards) {
      const existing = find(this.tappedOut.cards, { id: card.id });
      if (!existing) continue;
      card.tappedOut = existing.tappedOut;
    }

    logger.silly("copying tappedOut object to all cards in this.edhRec");
    for (const card of this.edhRec.cards) {
      const existing = find(this.tappedOut.cards, { id: card.id });
      if (!existing) continue;
      card.tappedOut = existing.edhRec;
    }

    logger.silly("calculating similarity to this.deck");
    tappedOutDeck.similarity = ((similarity / this.deck.cards.length) * 1000) / 10;

    this.tappedOut.decks.push(tappedOutDeck);
  }

  /**
   * @param {EDHRecRecommendation} edhRecRecommendation
   */
  addEDHRecRecommendation(edhRecRecommendation) {
    if (this.edhRec.cards.length) {
      throw new Error("you can only use addEDHRecRecommendation once");
    }

    this.edhRec = edhRecRecommendation;

    logger.silly("copying edhRec object to all cards in this.deck");
    for (const card of this.deck.cards) {
      const existing = find(this.edhRec.cards, { id: card.id });
      if (!existing) continue;
      card.edhRec = existing.edhRec;
    }

    logger.silly("copying edhRec object to all cards in this.tappedOut");
    for (const card of this.tappedOut.cards) {
      const existing = find(this.edhRec.cards, { id: card.id });
      if (!existing) continue;
      card.edhRec = existing.edhRec;
    }
  }

  /**
   * @returns {Array<Card>}
   */
  getMostRecommendedCards() {
    const cards = [];
    const sortedArray = ArraySort.sortProperty(this.edhRec.cards, "edhRec.percent", SortBy.DESCENDING);

    for (const card of sortedArray) {
      if (find(this.deck.cards, { id: card.id })) continue;
      cards.push(card);
    }

    return cards;
  }

  /**
   * @returns {Array<Card>}
   */
  getMostPopularCards() {
    const cards = [];
    const sortedArray = ArraySort.sortProperty(this.tappedOut.cards, "tappedOut.percent", SortBy.DESCENDING);

    for (const card of sortedArray) {
      if (find(this.deck.cards, { id: card.id })) continue;
      cards.push(card);
    }

    return cards;
  }

  /**
   * @returns {TappedOutDeck}
   */
  getMostSimilarDeck() {
    const cards = [];
    const decks = ArraySort.sortProperty(this.tappedOut.decks, "similarity", SortBy.DESCENDING);
    const deck = decks[0];
    const sortedArray = ArraySort.sortProperty(deck.cards, "tappedOut.percent", SortBy.DESCENDING);

    for (const card of sortedArray) {
      if (find(this.deck.cards, { id: card.id })) continue;
      cards.push(card);
    }

    return new TappedOutDeck({ ...deck, cards });
  }

  /**
   * @returns {Array<Card>}
   */
  getLeastPopularCardsInDeck() {
    return ArraySort.sortProperty(this.deck.cards, "tappedOut.percent", SortBy.ASCENDING);
  }
}
