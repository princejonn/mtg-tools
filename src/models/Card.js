export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.type = data.type_line;
    this.text = data.oracle_text;

    this.image = null;
    this.cardFaces = null;
    this.primaryImages = null;
    this.secondaryImages = null;

    if (data.image_uris) {
      this.primaryImages = data.image_uris;
    } else if (data.card_faces && data.card_faces.length) {
      this.cardFaces = data.card_faces;
      this.primaryImages = data.card_faces[0].image_uris;
      this.secondaryImages = data.card_faces[1].image_uris;
    } else {
      console.log(data);
      throw new Error("card found without any image data");
    }

    this.image = this.primaryImages.normal;

    this.manaCost = data.mana_cost;
    this.colors = data.colors;
    this.colorIdentity = data.color_identity;

    this.uri = data.scryfall_uri;

    this.exists = {
      commander: false,
      edhRec: false,
      tappedOut: false,
    };
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
   */
  setCommander() {
    this.exists.commander = true;
  }

  /**
   * @param {{amount: number, percent: number, synergy: number}} data
   */
  setEdhRec(data) {
    if (!data) {
      throw new Error("trying to set edhRec data with no data");
    }

    this.exists.edhRec = true;

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

    this.exists.tappedOut = true;

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
    this.tappedOut.percent = ((this.tappedOut.amount / addedDecks) * 1000) / 10;
  }
}
