export default class RateLimit {
  static async edhRec() {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), 100);
    });
  }

  static async scryfall() {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), 120);
    });
  }

  static async tappedOut() {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), 200);
    });
  }
}
