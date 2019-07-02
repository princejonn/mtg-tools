import searchString from "utils/SearchString";

export default class Commander {
  constructor(data) {
    this.name = data.name;
    this.url = data.url;
    this.queryString = searchString(this.name);
  }
}
