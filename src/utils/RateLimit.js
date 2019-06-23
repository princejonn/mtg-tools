export default class RateLimit {
  static async edhRec() {
    await RateLimit.delay(250);
  }

  static async scryfall() {
    await RateLimit.delay(250);
  }

  static async tappedOut() {
    await RateLimit.delay(1000);
  }

  static async delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), milliseconds);
    });
  }
}
