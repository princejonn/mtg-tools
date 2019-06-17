import { includes } from "lodash";
import logger from "logger";
import DeckList from "objects/DeckList";
import EDHRec from "pages/EDHRec";
import PuppeteerManager from "components/PuppeteerManager";
import TappedOut from "pages/TappedOut";
import Selector from "enums/Selector";
import Reporter from "components/Reporter";
import DomainTypeError from "errors/DomainTypeError";

export default class Improve {
  constructor(url, username, password) {
    if (!includes(url, "http")) {
      throw new DomainTypeError({ url });
    }

    this.url = url;
    this.manager = new PuppeteerManager();

    this.username = username;
    this.password = password;
  }

  async run() {
    console.log("Starting...\nThis will take ~5 minutes.\nYou will be asked for EDHRec theme at the end.\n");
    logger.info("starting commander deck improve run");

    const deckList = new DeckList();

    await this.manager.init();
    const tappedOut = new TappedOut(this.manager);

    logger.verbose("logging in");
    await tappedOut.login(this.username, this.password);

    await tappedOut.goto({
      url: this.url,
      waitForSelector: Selector.TappedOut.CARD,
    });

    logger.verbose("fetching commander query string");
    const commanderQueryString = await tappedOut.getCommanderQueryString();

    logger.verbose("adding commander cards to DeckList");
    const commanderCards = await tappedOut.getCards();

    for (const card of commanderCards) {
      card.setDeck();
    }

    deckList.join(commanderCards);

    logger.verbose("adding TappedOut similar decks cards to DeckList");
    const similarDeckLinks = await tappedOut.getSimilarDeckLinks(commanderQueryString);

    for (const deckLink of similarDeckLinks) {
      await tappedOut.goto({
        url: deckLink,
        waitForSelector: Selector.TappedOut.CARD,
      });
      const cards = await tappedOut.getCards();
      deckList.join(cards);
    }

    logger.verbose("Starting EDH Rec");
    const edhRec = new EDHRec(this.manager, commanderQueryString);
    await edhRec.goto();

    logger.verbose("Asking for input on which EDHRec theme to use");
    await edhRec.selectThemeAndBudget();

    logger.verbose("adding EDHRec cards to DeckList");
    const edhRecCards = await edhRec.getSuggestedCards();

    deckList.join(edhRecCards);

    logger.verbose("creating report");
    const reporter = new Reporter(commanderQueryString, deckList);

    await reporter.create();
  }
}
