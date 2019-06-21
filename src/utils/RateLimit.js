export default class RateLimit {
  static async edhRec() {
    await RateLimit.delay(300);
  }

  static async scryfall() {
    await RateLimit.delay(200);
  }

  static async tappedOut() {
    await RateLimit.delay(300);
  }

  static async delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null), milliseconds);
    });
  }
}
