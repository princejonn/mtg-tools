import { includes } from "lodash";

export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.typeLine = data.typeLine;
    this.image = data.image;
    this.colors = data.colors;
    this.manaCost = data.manaCost;
    this.uri = data.uri;
    this.scryfallUri = data.scryfallUri;

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

    this.type = null;

    this._setType();
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
   * @param {number} addedDecks
   */
  calculatePercent(addedDecks) {
    this.tappedOut.percent = Math.floor((this.tappedOut.amount / addedDecks) * 1000) / 10;
    this.percent = Math.floor(((this.tappedOut.percent + this.edhRec.percent) / 200) * 1000) / 10;
  }

  /**
   * @private
   */
  _setType() {
    let type = this.typeLine.toLowerCase();

    type = type.replace(/hero/g, "");
    type = type.replace(/snow/g, "");
    type = type.replace(/snow/g, "");
    type = type.replace(/token/g, "");
    type = type.replace(/tribal/g, "");
    type = type.replace(/world/g, "");
    type = type.replace(/\'/g, "");
    type = type.replace(/\,/g, "");

    if (includes(type, "//")) {
      const split = type.split("//");
      type = split[0].trim();
    }

    if (includes(type, "—")) {
      const split = type.split("—");
      type = split[0].trim();
    }

    type = type.replace(/\s/g, "_");

    if (!type) {
      type = "Special";
    }

    this.type = type;
  }
}
