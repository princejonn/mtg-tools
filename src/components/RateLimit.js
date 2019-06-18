export default class RateLimit {
  static async edhRec() {
    await RateLimit.delay(333);
  }

  static async scryfall() {
    await RateLimit.delay(111);
  }

  static async tappedOut() {
    await RateLimit.delay(333);
  }

  static async delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), milliseconds);
    });
  }
}
