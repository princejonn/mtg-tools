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
    this.tappedOutAmount = 0;
    this.tappedOutPercent = 0;
    this.edhRecAmount = 0;
    this.edhRecPercent = 0;
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
   * @param {string} image
   */
  setImage(image) {
    if (Card.isImageValid(image)) {
      this.image = image;
    }
  }

  /**
   */
  setEDHRec() {
    this.isEDHRec = true;
  }

  /**
   * @param {number} amount
   */
  setEDHRecAmount(amount) {
    this.edhRecAmount = amount;
  }

  /**
   * @param {number} percent
   */
  setEDHRecPercent(percent) {
    this.edhRecPercent = percent;
  }

  /**
   * @param {number} [synergy]
   */
  setEDHRecSynergy(synergy = 0) {
    this.synergy = synergy;
  }

  /**
   */
  setTappedOut() {
    this.isTappedOut = true;
  }

  /**
   * @param {number} [amount]
   */
  addTappedOutAmount(amount = 1) {
    this.tappedOutAmount += amount;
  }

  /**
   * @param {number} amount
   */
  setTappedOutAmount(amount) {
    this.tappedOutAmount = amount;
  }

  /**
   * @param {number} percent
   */
  setTappedOutPercent(percent) {
    this.tappedOutPercent = percent;
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
    if (!image) return false;
    return includes(image.toLowerCase(), "scryfall");
  }
}
