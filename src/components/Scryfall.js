import request from "request-promise-native";
import logger from "logger";

export default class Scryfall {
  static async getImage(card) {
    await new Promise((resolve) => {
      setTimeout(resolve.bind(null), 150);
    });

    let result;

    try {
      const { name } = card;
      const url = `https://api.scryfall.com/cards/search?q=${name}`;

      logger.debug(`requesting [ ${name} ] image from scryfall [ ${url} ]`);

      result = await request(url, { method: "GET" });

      const parsed = JSON.parse(result);
      const data = parsed.data[0];

      if (data.card_faces && data.card_faces.length) {
        const primaryFace = data.card_faces[0];
        return primaryFace.image_uris.normal;
      }

      return data.image_uris.normal;
    } catch (err) {
      logger.error(err);
      logger.debug("result", result);
    }
  }
}
