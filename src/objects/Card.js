import { isString, includes } from "lodash";
import DomainTypeError from "errors/DomainTypeError";

export default class Card {
  /**
   * @param {string} name
   * @param {string} image
   */
  constructor(name, image) {
    if (!isString(name)) {
      throw new DomainTypeError({ name });
    }

    this.name = name;
    this.image = null;
    this.amount = 0;
    this.synergy = 0;

    this.isDeck = false;
    this.isEDHRec = false;
    this.isTappedOut = false;

    this.setImage(image);
  }

  /**
   */
  setDeck() {
    this.isDeck = true;
  }

  /**
   */
  setEDHRec() {
    this.isEDHRec = true;
  }

  /**
   */
  setTappedOut() {
    this.isTappedOut = true;
  }

  /**
   * @param {number} [synergy]
   */
  setSynergy(synergy = 0) {
    this.synergy = synergy;
  }

  /**
   * @param {string} image
   */
  setImage(image) {
    if (Card.isImageValid(image)) {
      this.image = image;
    }
  }

  /**
   * @param {number} [amount]
   */
  addAmount(amount = 1) {
    this.amount += amount;
  }

  /**
   * @param {Card} card
   */
  isSame(card) {
    const name = card.name.replace(/\s+\/\/.*/, "");
    return name === this.name;
  }

  /**
   * @param {string} image
   * @returns {boolean}
   */
  static isImageValid(image) {
    return includes(image.toLowerCase(), "scryfall");
  }
}
