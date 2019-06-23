import { includes } from "lodash";

export default class TappedOutDeck {
  constructor(data) {
    this.id = data.id;
    this.url = data.url;
    this.cards = data.cards;
    this.similarity = data.similarity || 0;

    this.types = {
      artifact: 0,
      creature: 0,
      enchantment: 0,
      instant: 0,
      sorcery: 0,
      lands: {
        basic: 0,
        special: 0,
      },
    };
  }

  calculateTypes() {
    for (const card of this.cards) {
      const typeLine = card.typeLine.toLowerCase();

      if (includes(typeLine, "artifact")) {
        this.types.artifact += 1;
      }
      if (includes(typeLine, "creature")) {
        this.types.creature += 1;
      }
      if (includes(typeLine, "enchantment")) {
        this.types.enchantment += 1;
      }
      if (includes(typeLine, "instant")) {
        this.types.instant += 1;
      }
      if (includes(typeLine, "sorcery")) {
        this.types.sorcery += 1;
      }

      if (includes(typeLine, "land") && includes(typeLine, "basic")) {
        this.types.lands.basic += 1;
      }
      if (includes(typeLine, "land") && !includes(typeLine, "basic")) {
        this.types.lands.special += 1;
      }
    }
  }
}
