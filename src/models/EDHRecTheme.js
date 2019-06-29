export default class EDHRecTheme {
  constructor(data) {
    this.text = data.text;
    this.url = data.url;
    this.type = data.type;
    this.num = parseInt(data.num, 10);
  }
}
