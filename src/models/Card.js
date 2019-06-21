export default class Card {
  constructor(data) {
    if (!data) {
      throw new Error("data required to set Card");
    }

    this.id = data.id;
    this.name = data.name;
    this.type = data.type_line;
    this.text = data.oracle_text;

    this.image = null;
    this.cardFaces = null;
    this.primaryImages = null;
    this.secondaryImages = null;

    if (data.image_uris) {
      this.primaryImages = data.image_uris;
    } else if (data.card_faces && data.card_faces.length) {
      this.cardFaces = data.card_faces;
      this.primaryImages = data.card_faces[0].image_uris;
      this.secondaryImages = data.card_faces[1].image_uris;
    } else {
      console.log(data);
      throw new Error("card found without any image data");
    }

    this.image = this.primaryImages.normal;

    this.manaCost = data.mana_cost;
    this.colors = data.colors;
    this.colorIdentity = data.color_identity;

    this.uri = data.scryfall_uri;

    this.edhRec = {
      amount: data.edhRec && data.edhRec.amount || 0,
      percent: data.edhRec && data.edhRec.percent || 0,
      synergy: data.edhRec && data.edhRec.synergy || 0,
    };

    this.tappedOut = {
      amount: data.tappedOut && data.tappedOut.amount || 0,
      percent: data.tappedOut && data.tappedOut.percent || 0,
    };
  }
}
