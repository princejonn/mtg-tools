export default class TappedOutDeck {
  constructor(data) {
    this.id = data.id;
    this.url = data.url;
    this.cards = data.cards;
    this.similarity = data.similarity || 0;
  }
}
