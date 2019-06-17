import logger from "logger";
import ArraySort from "components/ArraySort";
import Scryfall from "components/Scryfall";
import SortBy from "enums/SortBy";

export default class DeckList {
  constructor() {
    this.list = [];
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
   * @param {boolean} inDeck
   * @param {string} property
   * @param {string} sortBy
   * @param {number} listSize
   * @returns {Array<Card>}
   * @private
   */
  async _getCardsFromList(inDeck, property, sortBy, listSize = 16) {
    const pickedCards = [];
    for (const card of this.list) {
      if (!card.isDeck && inDeck) continue;
      if (card.isDeck && !inDeck) continue;
      if (card.synergy <= -1) continue;
      pickedCards.push(card);
    }

    const sortedCards = ArraySort.sortProperty(pickedCards, property, sortBy);

    const returningCards = [];
    for (let i = 0; i < listSize; i++) {
      const card = sortedCards[i];
      if (!card.image) {
        const scryfallImage = await Scryfall.getImage(card);
        card.setImage(scryfallImage);
      }
      returningCards.push(card);
    }

    return returningCards;
  }
}
