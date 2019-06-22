import { filter, find } from "lodash";
import logger from "logger";
import ArraySort, { SortBy } from "utils/ArraySort";
import TappedOutDeck from "./TappedOutDeck";

export default class CommanderDeck {
  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  constructor(tappedOutDeck) {
    this.cards = tappedOutDeck.cards;
    this.length = tappedOutDeck.cards.length;
    this.tappedOut = {
      decks: [],
      added: 1,
    };

    for (const card of this.cards) {
      card.setCommander();
    }
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  addDeck(tappedOutDeck) {
    for (const deck of this.tappedOut.decks) {
      if (tappedOutDeck.url !== deck.url) continue;
      throw new Error("you can only add a unique tappedOutDeck once");
    }

    this.tappedOut.added += 1;
    let similarity = 0;
    const { cards } = tappedOutDeck;

    for (const card of cards) {
      const existing = find(this.cards, { id: card.id });
      if (existing) {
        existing.addTappedOutAmount(card.tappedOut.amount);
        existing.calculatePercent(this.tappedOut.added);
        similarity += 1;
      } else {
        card.calculatePercent(this.tappedOut.added);
        this.cards.push(card);
      }
    }

    logger.silly("calculating similarity to this.deck");
    tappedOutDeck.similarity = ((similarity / this.length) * 1000) / 10;

    this.tappedOut.decks.push(tappedOutDeck);
  }

  /**
   * @param {EDHRecRecommendation} edhRecRecommendation
   */
  addRecommendation(edhRecRecommendation) {
    const { cards } = edhRecRecommendation;

    for (const card of cards) {
      const existing = find(this.cards, { id: card.id });
      if (existing) {
        existing.setEdhRec(card.edhRec);
      } else {
        this.cards.push(card);
      }
    }
  }

  /**
   * @returns {Array<Card>}
   */
  getMostRecommendedCards() {
    const cards = filter(this.cards, {
      exists: {
        commander: false,
        edhRec: true,
      },
    });
    return ArraySort.sortProperty(cards, "edhRec.percent", SortBy.DESCENDING);
  }

  /**
   * @returns {Array<Card>}
   */
  getMostPopularCards() {
    const cards = filter(this.cards, {
      exists: {
        commander: false,
        tappedOut: true,
      },
    });
    return ArraySort.sortProperty(cards, "tappedOut.percent", SortBy.DESCENDING);
  }

  /**
   * @returns {TappedOutDeck}
   */
  getMostSimilarDeck() {
    const decks = ArraySort.sortProperty(this.tappedOut.decks, "similarity", SortBy.DESCENDING);
    const deck = decks[0];
    const { id, url, similarity } = deck;

    for (const card of deck.cards) {
      const exists = find(this.cards, { id: card.id });
      if (!exists) continue;
      card.setEdhRec(exists.edhRec);
      card.setTappedOut(exists.tappedOut);
    }

    const sortedArray = ArraySort.sortProperty(deck.cards, "tappedOut.percent", SortBy.DESCENDING);
    const cards = filter(sortedArray, {
      exists: {
        commander: false,
      },
    });

    return new TappedOutDeck({ id, url, similarity, cards });
  }

  /**
   * @returns {Array<Card>}
   */
  getLeastPopularCardsInDeck() {
    return ArraySort.sortProperty(this.cards, "tappedOut.percent", SortBy.ASCENDING);
  }
}
