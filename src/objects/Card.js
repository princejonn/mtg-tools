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
    this._validateImage(image);

    this.name = name;
    this.image = image;
    this.amount = 0;
    this.synergy = 0;

    this.isDeck = false;
    this.isEDHRec = false;
    this.isTappedOut = false;
  }

  /**
   * @returns {string}
   */
  getTxt() {
    return `${this.name}\r\n  image: ${this.image}\r\n  data: [ amount: ${this.amount} ] [ synergy: ${this.synergy}% ]\r\n\r\n`;
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
    this._validateImage(image);
    this.image = image;
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
   * @param image
   * @private
   */
  _validateImage(image) {
    if (
      !includes(image.toLowerCase(), "jpg") &&
      !includes(image.toLowerCase(), "jpeg") &&
      !includes(image.toLowerCase(), "png")
    ) {
      throw new DomainTypeError({ image });
    }
  }
}
