export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.colors = data.colors;
    this.manaCost = data.manaCost;
    this.uri = data.uri;

    this.isCommander = false;
    this.isEDHRec = false;
    this.isTappedOut = false;

    this.edhRec = {
      amount: 0,
      percent: 0,
      synergy: 0,
    };
    this.tappedOut = {
      amount: 0,
      percent: 0,
    };
  }

  /**
   * @param {{amount: number, percent: number, synergy: number}} data
   */
  setEdhRec(data) {
    if (!data) {
      throw new Error("trying to set edhRec data with no data");
    }

    this.isEDHRec = true;
    this.edhRec.amount = data.amount || this.edhRec.amount;
    this.edhRec.percent = data.percent || this.edhRec.percent;
    this.edhRec.synergy = data.synergy || this.edhRec.synergy;
  }

  /**
   * @param {{amount: number, percent: number}} data
   */
  setTappedOut(data) {
    if (!data) {
      throw new Error("trying to set tappedOut data with no data");
    }

    this.isTappedOut = true;
    this.tappedOut.amount = data.amount || this.tappedOut.amount;
    this.tappedOut.percent = data.percent || this.tappedOut.percent;
  }

  /**
   * @param {number} amount
   */
  addTappedOutAmount(amount = 1) {
    this.tappedOut.amount += amount;
  }

  /**
   * @param {number} addedDecks
   */
  calculatePercent(addedDecks) {
    this.tappedOut.percent = Math.floor((this.tappedOut.amount / addedDecks) * 1000) / 10;
  }
}
