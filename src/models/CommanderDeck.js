import { filter, find } from "lodash";
import TappedOutDeck from "models/TappedOutDeck";
import Card from "models/Card";
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

    console.log("creating new CommanderDeck");
    console.log("adding cards to CommanderDeck");
    for (const data of tappedOutDeck.cards) {
      const card = new Card(data);
      card.isCommander = true;
      this.cards.push(card);
    }
    console.log("cards added to CommanderDeck");
  }

  /**
   * @param {TappedOutDeck} tappedOutDeck
   */
  addDeck(tappedOutDeck) {
    this.tappedOut.added += 1;
    let similarity = 0;
    const { cards } = tappedOutDeck;

    for (const cardData of cards) {
      const existingCard = find(this.cards, { id: cardData.id });
      if (existingCard) {
        existingCard.isTappedOut = true;
        existingCard.addTappedOutAmount(cardData.tappedOut.amount);
        similarity += 1;
      } else {
        const newCard = new Card(cardData);
        newCard.isTappedOut = true;
        this.cards.push(newCard);
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

    for (const cardData of cards) {
      const existingCard = find(this.cards, { id: cardData.id });
      if (existingCard) {
        existingCard.isEDHRec = true;
        existingCard.setEdhRec(cardData.edhRec);
      } else {
        const newCard = new Card(cardData);
        newCard.isEDHRec = true;
        this.cards.push(newCard);
      }
    }
  }

  calculate() {
    if (this.isCalculated) return;

    for (const card of this.cards) {
      card.calculatePercent(this.tappedOut.added);
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

    for (const cardData of deck.cards) {
      const existingCard = find(this.cards, { id: cardData.id });

      if (!existingCard) {
        throw new Error("could not find card");
      }

      if (existingCard.isCommander) continue;

      const newCard = new Card(cardData);
      newCard.setEdhRec(existingCard.edhRec);
      newCard.setTappedOut(existingCard.tappedOut);
      newCard.calculatePercent(this.tappedOut.added);
      array.push(newCard);
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

  _filterBasicLand(name) {
    const regExps = [
      /(.*(Basic)*.*Plains.*)/,
      /(.*(Basic)*.*Swamp.*)/,
      /(.*(Basic)*.*Mountain.*)/,
      /(.*(Basic)*.*Island.*)/,
      /(.*(Basic)*.*Forest.*)/,
    ];

    for (const regex of regExps) {
      if (name.match(regex)) return null;
    }
  }
}
