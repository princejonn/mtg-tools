import { includes } from "lodash";

export default class TappedOutDeck {
  constructor(data) {
    this.url = data.url;
    this.cards = data.cards;

    this.types = {
      artifact: 0,
      creature: 0,
      enchantment: 0,
      instant: 0,
      sorcery: 0,
      basicLands: 0,
      lands: 0,
    };
  }

  calculateTypes() {
    for (const card of this.cards) {
      const typeLine = card.typeLine.toLowerCase();

      if (includes(typeLine, "artifact")) {
        this.types.artifact += card.tappedOut.amount;
      }
      if (includes(typeLine, "creature")) {
        this.types.creature += card.tappedOut.amount;
      }
      if (includes(typeLine, "enchantment")) {
        this.types.enchantment += card.tappedOut.amount;
      }
      if (includes(typeLine, "instant")) {
        this.types.instant += card.tappedOut.amount;
      }
      if (includes(typeLine, "sorcery")) {
        this.types.sorcery += card.tappedOut.amount;
      }

      if (includes(typeLine, "land") && includes(typeLine, "basic")) {
        this.types.basicLands += card.tappedOut.amount;
      }
      if (includes(typeLine, "land") && !includes(typeLine, "basic")) {
        this.types.lands += card.tappedOut.amount;
      }
    }
  }
}
