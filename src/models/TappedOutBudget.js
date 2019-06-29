export default class TappedOutBudget {
  constructor(data) {
    this.text = data.text;
    this.price = parseInt(data.price, 10);
    this.num = parseInt(data.num);
  }
}
