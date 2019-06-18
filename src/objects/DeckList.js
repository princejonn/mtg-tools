import logger from "logger";
import ArraySort from "components/ArraySort";
import Scryfall from "components/Scryfall";
import SortBy from "enums/SortBy";

export default class DeckList {
  constructor() {
    this.list = [];
    this.decks = [];
    this.rxBasicLand = [
      /((.*)(Plains)(.*))/,
      /((.*)(Swamp)(.*))/,
      /((.*)(Mountain)(.*))/,
      /((.*)(Island)(.*))/,
      /((.*)(Forest)(.*))/,
    ];
  }

  /**
   * @param {Array<Card>} array
   */
  join(array) {
    logger.debug("joining array into DeckList");
    for (const card of array) {
      this.add(card);
    }
  }

  /**
   * @param {Card} card
   */
  add(card) {
    for (const regex of this.rxBasicLand) {
      if (card.name.match(regex)) return;
    }

    for (const listCard of this.list) {
      if (!listCard.isSame(card)) continue;

      if (card.isTappedOut) {
        listCard.addTappedOutAmount(card.tappedOutAmount);
      }

      if (card.isEDHRec) {
        listCard.setEDHRecAmount(card.edhRecAmount);
        listCard.setEDHRecSynergy(card.synergy);
      }

      listCard.setImage(card.image);

      return;
    }

    this.list.push(card);
  }

  /**
   * @param {string} deckLink
   * @param {Array<Card>} cards
   */
  attach({ deckLink, cards }) {
    if (cards.length > 110) return;
    logger.debug("attaching cards into DeckList decks array");
    const { similarity, difference } = this._calculateSimilarity(cards);
    this.decks.push({ deckLink, similarity, difference });
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getEDHRecSuggestions() {
    return this._getCardsFromList(false, "edhRecAmount", SortBy.DESC, 16);
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getTappedOutSuggestions() {
    return this._getCardsFromList(false, "tappedOutAmount", SortBy.DESC, 16);
  }

  /**
   * @returns {Promise<Array<Card>>}
   */
  async getLeastUsedCardsInDeck() {
    return this._getCardsFromList(true, "tappedOutAmount", SortBy.ASC, 16);
  }

  /**
   * @returns {Promise<{ link: string, similarity: number, cards: Array<Card> }>}
   */
  async getMostSimilarDeck() {
    const array = ArraySort.sortProperty(this.decks, "similarity", SortBy.DESC);
    const cards = array[0].difference;

    for (const card of cards) {
      for (const deckCard of this.list) {
        if (card.isSame(deckCard)) {
          card.setImage(deckCard.image);
          card.setEDHRecAmount(deckCard.edhRecAmount);
          card.setEDHRecSynergy(deckCard.synergy);
          card.setTappedOutAmount(deckCard.tappedOutAmount);
        }
      }

      if (!card.image) {
        const scryfallImage = await Scryfall.getImage(card);
        card.setImage(scryfallImage);
      }
    }

    return {
      link: array[0].deckLink,
      similarity: array[0].similarity,
      cards,
    };
  }

  /**
   * @param {Array<Card>} comparisonCards
   * @returns {{ similarity: number, difference: Array<Card> }}
   * @private
   */
  _calculateSimilarity(comparisonCards) {
    const inDeckCards = [];
    const difference = [];
    let counter = 0;

    for (const card of this.list) {
      if (!card.isDeck) continue;
      inDeckCards.push(card);
    }

    if (!inDeckCards.length) {
      throw new Error("There are no cards in the deck. you need to add your own commander deck first.");
    }

    for (const comparisonCard of comparisonCards) {
      let basicLand = false;

      for (const regex of this.rxBasicLand) {
        if (comparisonCard.name.match(regex)) {
          basicLand = true;
        }
      }

      if (basicLand) continue;

      let isAlreadyInDeck = false;

      for (const inDeckCard of inDeckCards) {
        if (comparisonCard.isSame(inDeckCard)) {
          isAlreadyInDeck = true;
        }
      }

      if (isAlreadyInDeck) {
        counter += 1;
      }

      if (!isAlreadyInDeck) {
        difference.push(comparisonCard);
      }
    }

    const similarity = Math.floor(((counter / comparisonCards.length) * 1000) / 10);

    return { similarity, difference };
  }

  /**
   * @param {boolean} inDeck
   * @param {string} property
   * @param {string} sortBy
   * @param {number} maximum
   * @returns {Array<Card>}
   * @private
   */
  async _getCardsFromList(inDeck, property, sortBy, maximum = 16) {
    const pickedCards = [];
    for (const card of this.list) {
      if (!card.isDeck && inDeck) continue;
      if (card.isDeck && !inDeck) continue;
      if (card.synergy <= -1) continue;
      pickedCards.push(card);
    }

    const sortedCards = ArraySort.sortProperty(pickedCards, property, sortBy);

    const returningCards = [];
    let max = maximum;

    for (let i = 0; i < sortedCards.length; i++) {
      const card = sortedCards[i];
      if (!card.image) {
        const scryfallImage = await Scryfall.getImage(card);
        card.setImage(scryfallImage);
      }
      returningCards.push(card);
      max -= 1;
      if (max === 0) break;
    }

    return returningCards;
  }
}
