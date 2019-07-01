export default class ProgramInventoryChoice {
  constructor(data) {
    this.text = data.text;
    this.value = !!data.value;
    this.num = parseInt(data.num);
  }
}
