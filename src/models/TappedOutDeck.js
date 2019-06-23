export default class TappedOutDeck {
  constructor(data) {
    this.id = data.id;
    this.url = data.url;
    this.cards = data.cards;
    this.similarity = data.similarity || 0;
    this.types = {};
  }

  calculateTypes() {
    for (const card of this.cards) {
      const type = card.typeLine
        .toLowerCase()
        .split(" ")[0];

      if (!this.types[type]) {
        this.types[type] = 0;
      }
      this.types[type] += 1;
    }
  }
}
