import { isString } from "lodash";
import logger from "logger";
import BasePage from "pages/BasePage";
import Card from "objects/Card";
import ElementAttribute from "enums/ElementAttribute";
import Selector from "enums/Selector";
import DomainTypeError from "errors/DomainTypeError";

export default class EDHRec extends BasePage {
  constructor(manager, commanderQueryString) {
    super(manager);

    if (!isString(commanderQueryString)) {
      throw new DomainTypeError({ commanderQueryString });
    }

    this.commanderQueryString = commanderQueryString;
    this.url = `https://edhrec.com/commanders/${this.commanderQueryString}`;
  }

  async getSuggestedCards() {
    const array = [];

    logger.verbose("getting suggested cards from EDHRec");
    logger.debug("going to url", this.url);

    await this.goto({
      url: this.url,
      waitForSelector: Selector.EdhRec.Card.ELEMENT,
    });

    const regexDecksPercent = /(\d+\%.*of)/;
    const regexDecksNumber = /(of.*)(\d+)(.*decks)/;
    const regexSynergy = /(\+|\-)(\d+)(\%.*synergy)/;
    const numbers = /\d+\.?\d*/;

    logger.debug("locating cards");

    const cards = await this.page.$$(Selector.EdhRec.Card.ELEMENT);

    for (const element of cards) {
      const nameElement = await element.$(Selector.EdhRec.Card.NAME);
      const descElement = await element.$(Selector.EdhRec.Card.DESC);
      const imageElement = await element.$(Selector.EdhRec.Card.IMAGE);

      const name = await this.getElementText(nameElement);
      const desc = await this.getElementText(descElement);
      const image = await this.getElementAttribute(imageElement, ElementAttribute.DATA_SRC);

      const inPercentOfDecks = desc.match(regexDecksPercent)[0];
      const inPercentOfDecksDigits = inPercentOfDecks.match(numbers)[0];
      const inPercentOfDecksFloat = parseFloat(`0.${inPercentOfDecksDigits}`);

      const inAmountOfDecks = desc.match(regexDecksNumber)[0].match(numbers)[0];
      const inAmountOfDecksDigits = inAmountOfDecks.match(numbers)[0];
      const inAmountOfDecksFloat = parseFloat(inAmountOfDecksDigits);

      const plusMinusSynergy = desc.match(regexSynergy)[1];

      const synergyInDecks = desc.match(regexSynergy)[0];
      const synergyInDecksDigits = synergyInDecks.match(numbers)[0];

      const synergy = parseFloat(`${plusMinusSynergy}${synergyInDecksDigits}`);

      const amount = Math.floor(inAmountOfDecksFloat * inPercentOfDecksFloat);

      const card = new Card(name, image);

      card.addAmount(amount);
      card.setEDHRec();
      card.setSynergy(synergy);

      logger.silly("adding EDHRec card", card.name);

      array.push(card);
    }

    return array;
  }
}
