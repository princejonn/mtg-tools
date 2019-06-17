import { includes } from "lodash";
import logger from "logger";
import ArraySort from "components/ArraySort";
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

    for (let regex of this.rxBasicLand) {
      if (card.name.match(regex)) return;
    }

    this.list.push(card);
  }

  /**
   * @returns {Array<Card>}
   */
  getCardsInDeckByLeastUsage() {
    logger.debug("returning DeckList cards by least usage");
    const array = this._getCardsFromList(true);
    return ArraySort.sortProperty(array, "amount", SortBy.ASC);
  }

  /**
   * @returns {Array<Card>}
   */
  getCardsNotInDeckByMostUsage() {
    logger.debug("returning DeckList cards by not in deck and most usage");
    const array = this._getCardsFromList(false);
    return ArraySort.sortProperty(array, "amount", SortBy.DESC);
  }

  /**
   * @param {boolean} inDeck
   * @returns {Array<Card>}
   * @private
   */
  _getCardsFromList(inDeck) {
    const array = [];

    for (const card of this.list) {
      if (!card.isDeck && inDeck) continue;
      if (card.isDeck && !inDeck) continue;
      if (card.synergy <= -1) continue;

      array.push(card);
    }

    return array;
  }
}
