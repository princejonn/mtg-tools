export default class Commander {
  constructor(data) {
    this.name = data.name;
    this.url = data.url;
    this._setQueryString();
  }

  _setQueryString() {
    this.queryString = this.name
      .replace(/\s/g, "-")
      .replace(/\'/g, "")
      .replace(/\,/g, "")
      .toLowerCase();
  }
}
