import { includes } from "lodash";

export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.colors = data.colors;
    this.manaCost = data.manaCost;
    this.uri = data.scryfallUri;

    this.image = null;
    if (data.imageUris) {
      this.image = data.imageUris.normal;
    } else if (data.cardFaces && data.cardFaces.length) {
      this.image = data.cardFaces[0].imageUris.normal;
    }

    this.isCommander = false;
    this.edhRec = {
      amount: 0,
      percent: 0,
      synergy: 0,
    };
    this.tappedOut = {
      amount: 0,
      percent: 0,
    };

    this.inventory = { amount: 0 };
    this.position = 0;

    this.type = null;
    this._setType(data.typeLine);
  }

  /**
   * @param {{amount: number, percent: number, synergy: number}} data
   */
  setEDHRec(data) {
    if (!data) return;
    this.edhRec.amount = data.amount || this.edhRec.amount;
    this.edhRec.percent = data.percent || this.edhRec.percent;
    this.edhRec.synergy = data.synergy || this.edhRec.synergy;
  }

  /**
   * @param {{amount: number}} data
   */
  addTappedOut(data) {
    if (!data) return;
    this.tappedOut.amount += data.amount;
  }

  /**
   * @param {{amount: number}} data
   */
  setTappedOut(data) {
    if (!data) return;
    this.tappedOut.amount = data.amount;
  }

  /**
   * @param {{amount: number}} data
   */
  setInventory(data) {
    if (!data) return;
    this.inventory.amount = data.amount;
  }

  /**
   * @param {{position: number}} data
   */
  setPosition(data) {
    if (!data) return;
    if (this.position !== 0 && this.position < data.position) return;
    this.position = data.position;
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
   * @param {string} typeLine
   * @private
   */
  _setType(typeLine) {
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
