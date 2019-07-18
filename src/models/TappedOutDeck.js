export default class TappedOutDeck {
  /**
   * @param {{url: string, cards: Array}} data
   */
  constructor(data) {
    this.cards = data.cards;
    this.position = 0;
    this.url = data.url;
  }

  /**
   * @param {{position: number}} data
   */
  setPosition(data) {
    if (!data) return;
    this.position = data.position;
  }
}
