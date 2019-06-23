import { filter, find } from "lodash";
import TappedOutDeck from "models/TappedOutDeck";
import ArraySort, { SortBy } from "utils/ArraySort";

export default class CommanderDeck {
  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  constructor(tappedOutDeck) {
    this.cards = [];
    this.length = tappedOutDeck.cards.length;
    this.tappedOut = {
      decks: [],
      added: 1,
    };
    this.isCalculated = false;

    tappedOutDeck.calculateTypes();
    this.types = tappedOutDeck.types;

    for (const card of tappedOutDeck.cards) {
      card.isCommander = true;
      this.cards.push(card);
    }
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  addDeck(tappedOutDeck) {
    this.tappedOut.added += 1;
    let similarity = 0;
    const { cards } = tappedOutDeck;

    for (const card of cards) {
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        existingCard.isTappedOut = true;
        existingCard.addTappedOutAmount(card.tappedOut.amount);
        similarity += 1;
      } else {
        card.isTappedOut = true;
        this.cards.push(card);
      }
    }

    tappedOutDeck.similarity = Math.floor((similarity / (this.length + cards.length)) * 1000) / 10;
    this.tappedOut.decks.push(tappedOutDeck);
  }

  /**
   * @param {EDHRecRecommendation} edhRecRecommendation
   */
  addRecommendation(edhRecRecommendation) {
    const { cards } = edhRecRecommendation;

    for (const card of cards) {
      const existingCard = find(this.cards, { id: card.id });

      if (existingCard) {
        existingCard.isEDHRec = true;
        existingCard.setEdhRec(card.edhRec);
      } else {
        card.isEDHRec = true;
        this.cards.push(card);
      }
    }
  }

  calculate() {
    if (this.isCalculated) return;

    for (const card of this.cards) {
      card.calculatePercent(this.tappedOut.added);
    }

    for (const deck of this.tappedOut.decks) {
      deck.calculateTypes();
    }

    this.isCalculated = true;
  }

  /**
   * @returns {Array<Card>}
   */
  getMostRecommendedCards() {
    this.calculate();
    const cards = filter(this.cards, {
      isCommander: false,
      isEDHRec: true,
    });
    return ArraySort.sortProperty(cards, "edhRec.percent", SortBy.DESCENDING);
  }

  /**
   * @returns {Array<Card>}
   */
  getMostPopularCards() {
    this.calculate();
    const cards = filter(this.cards, {
      isCommander: false,
      isTappedOut: true,
    });
    return ArraySort.sortProperty(cards, "tappedOut.percent", SortBy.DESCENDING);
  }

  /**
   * @returns {TappedOutDeck}
   */
  getMostSimilarDeck() {
    this.calculate();
    const decks = ArraySort.sortProperty(this.tappedOut.decks, "similarity", SortBy.DESCENDING);
    const deck = decks[0];
    const { id, url, similarity } = deck;
    const array = [];

    for (const card of deck.cards) {
      const alreadyPushed = find(array, { id: card.id });
      if (alreadyPushed) continue;

      const existingCard = find(this.cards, { id: card.id });

      if (!existingCard) {
        throw new Error("could not find card");
      }

      if (existingCard.isCommander) continue;

      card.setEdhRec(existingCard.edhRec);
      card.setTappedOut(existingCard.tappedOut);
      card.calculatePercent(this.tappedOut.added);
      array.push(card);
    }

    const cards = ArraySort.sortProperty(array, "tappedOut.percent", SortBy.DESCENDING);

    return new TappedOutDeck({ id, url, similarity, cards });
  }

  /**
   * @returns {Array<Card>}
   */
  getLeastPopularCardsInDeck() {
    this.calculate();
    const cards = filter(this.cards, { isCommander: true });
    return ArraySort.sortProperty(cards, "tappedOut.percent", SortBy.ASCENDING);
  }
}
