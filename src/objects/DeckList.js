import { includes } from "lodash";
import logger from "logger";
import ArraySort from "components/ArraySort";
import SortBy from "enums/SortBy";
import Scryfall from "../components/Scryfall";

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
    for (const listCard of this.list) {
      if (listCard.isSame(card)) {
        listCard.addAmount(card.amount);
        listCard.setSynergy(card.synergy);

        if (includes(card.image, "scryfall")) {
          listCard.setImage(card.image);
        }
        return;
      }
    }

    for (const regex of this.rxBasicLand) {
      if (card.name.match(regex)) return;
    }

    this.list.push(card);
  }

  /**
   * @returns {Array<Card>}
   */
  async getCardsInDeckByLeastUsage(amount) {
    logger.debug("returning DeckList cards by least usage");
    return this._getCardsFromList(true, SortBy.ASC, amount);
  }

  /**
   * @returns {Array<Card>}
   */
  async getCardsNotInDeckByMostUsage(amount) {
    logger.debug("returning DeckList cards by not in deck and most usage");
    return this._getCardsFromList(false, SortBy.DESC, amount);
  }

  /**
   * @param {boolean} inDeck
   * @param {string} sortBy
   * @param {number} amount
   * @returns {Array<Card>}
   * @private
   */
  async _getCardsFromList(inDeck, sortBy, amount = 20) {
    const pickedCards = [];
    for (const card of this.list) {
      if (!card.isDeck && inDeck) continue;
      if (card.isDeck && !inDeck) continue;
      if (card.synergy <= -1) continue;
      pickedCards.push(card);
    }

    const sortedCards = ArraySort.sortProperty(pickedCards, "amount", sortBy);

    const returningCards = [];
    for (let i = 0; i < amount; i++) {
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
