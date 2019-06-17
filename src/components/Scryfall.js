import request from "request-promise-native";

export default class Scryfall {
  static async getImage(card) {
    await new Promise((resolve) => {
      setTimeout(resolve.bind(null), 100);
    });

    const { name } = card;
    const url = `https://api.scryfall.com/cards/search?q=${name}`;
    const result = await request(url, { method: "GET" });
    const parsed = JSON.parse(result);
    return parsed.data[0].image_uris.normal;
  }
}
