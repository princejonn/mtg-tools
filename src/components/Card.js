import includes from "lodash/includes";
import isBoolean from "lodash/isBoolean";
import isNumber from "lodash/isNumber";
import isObject from "lodash/isObject";
import latinise from "utils/Latinise";

export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.simpleName = null;
    this.type = null;
    this.colors = data.colors;
    this.cmc = data.cmc;
    this.uri = data.scryfallUri;
    this.legal = data.legalities.commander === "legal";
    this.image = null;

    this.isCommander = false;
    this.position = 0;
    this.percent = 0;

    this.edhRec = {
      amount: 0,
      percent: 0,
      synergy: 0,
    };

    this.tappedOut = {
      amount: 0,
      percent: 0,
    };

    this.inventory = {
      amount: 0,
      missing: 0,
    };

    this._setImage(data);
    this._setSimpleName(data);
    this._setType(data);
  }

  //
  // Public
  //

  /**
   * @param {Card} data
   */
  addEDHRec(data) {
    if (!isObject(data)) return;
    if (!isObject(data.edhRec)) return;
    if (!isNumber(data.edhRec.amount)) return;
    this.edhRec.amount = data.edhRec.amount;
    this.edhRec.percent = data.edhRec.percent;
    this.edhRec.synergy = data.edhRec.synergy;
  }

  /**
   * @param {Card} data
   */
  addTappedOut(data) {
    if (!isObject(data)) return;
    if (!isObject(data.tappedOut)) return;
    if (!isNumber(data.tappedOut.amount)) return;
    this.tappedOut.amount += data.tappedOut.amount;
  }

  /**
   * @param {number} addedDecks
   */
  calculatePercent(addedDecks) {
    const weight = parseFloat(`1.${(100 - this.position)}`);
    const weightedTOAmount = this.tappedOut.amount * (weight * weight);
    let weightedTOPercent = this._percentWithOneDecimal(weightedTOAmount / addedDecks);

    if (weightedTOPercent > 100) {
      weightedTOPercent = 100;
    }

    this.tappedOut.percent = this._percentWithOneDecimal(this.tappedOut.amount / addedDecks);
    this.percent = this._percentWithOneDecimal((weightedTOPercent + this.edhRec.percent + this.edhRec.percent) / 300);
  }

  /**
   */
  calculateMissing() {
    this.inventory.missing = this.tappedOut.amount - this.inventory.amount;
  }

  /**
   * @param {boolean} isCommander
   */
  setCommander(isCommander) {
    if (!isBoolean(isCommander)) return;
    this.isCommander = isCommander;
  }

  /**
   * @param {number} amount
   */
  setInventory(amount) {
    if (!isNumber(amount)) return;
    this.inventory.amount = amount;
  }

  /**
   * @param {number} position
   */
  setPosition(position) {
    if (!isNumber(position)) return;
    if (this.position !== 0 && this.position < position) return;
    this.position = position;
  }

  //
  // Private
  //

  /**
   * @param {object} data
   * @private
   */
  _setImage(data) {
    if (
      data.imageUris &&
      data.imageUris.border_crop
    ) {
      this.image = data.imageUris.border_crop;
    } else if (
      data.imageUris &&
      data.imageUris.normal
    ) {
      this.image = data.imageUris.normal;
    } else if (
      data.cardFaces &&
      data.cardFaces[0] &&
      data.cardFaces[0].imageUris &&
      data.cardFaces[0].imageUris.border_crop
    ) {
      this.image = data.cardFaces[0].imageUris.border_crop;
    } else if (
      data.cardFaces &&
      data.cardFaces[0] &&
      data.cardFaces[0].imageUris &&
      data.cardFaces[0].imageUris.normal
    ) {
      this.image = data.cardFaces[0].imageUris.normal;
    }
  }

  /**
   * @param {object} data
   * @private
   */
  _setSimpleName(data) {
    let name = latinise(data.name);

    if (includes(name, "//")) {
      const split = name.split("//");
      name = split[0].trim();
    }

    this.simpleName = name;
  }

  /**
   * @param {object} data
   * @private
   */
  _setType(data) {
    const { typeLine } = data;

    let type = typeLine
      .toLowerCase()
      .replace(/hero/g, "")
      .replace(/token/g, "")
      .replace(/tribal/g, "")
      .replace(/world/g, "")
      .replace(/\'/g, "")
      .replace(/\,/g, "")
      .trim();

    if (includes(type, "//")) {
      const split = type.split("//");
      type = split[0].trim();
    }

    if (includes(type, "—")) {
      const split = type.split("—");
      type = split[0].trim();
    }

    type = type
      .replace(/\s/g, "_")
      .replace(/\_\_/g, "_");

    if (!type) {
      type = "special";
    }

    this.type = type;
  }

  /**
   * @param {number} calculation
   * @returns {number}
   * @private
   */
  _percentWithOneDecimal(calculation) {
    return Math.floor(calculation * 1000) / 10;
  }
}
