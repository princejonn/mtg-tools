import { includes } from "lodash";
import logger from "logger";
import PuppeteerManager from "components/PuppeteerManager";
import Reporter from "components/Reporter";
import Selector from "enums/Selector";
import DomainTypeError from "errors/DomainTypeError";
import DeckList from "objects/DeckList";
import EDHRec from "pages/EDHRec";
import TappedOut from "pages/TappedOut";

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
    console.log("Starting...\nThis will take ~5 minutes.\nYou will be asked to select EDHRec theme and budget.\n");

    logger.verbose("started improve run");
    const deckList = new DeckList();
    await this.manager.init();
    const tappedOut = new TappedOut(this.manager.page);

    logger.verbose(`login with username [ ${this.username} ]`);
    await tappedOut.login(this.username, this.password);
    await tappedOut.goto({
      url: this.url,
      waitForSelector: Selector.TappedOut.CARD,
    });

    logger.verbose("getting TappedOut commander query string");
    await tappedOut.setCommanderQueryString();
    this.commanderQueryString = await tappedOut.getCommanderQueryString();

    logger.verbose("adding TappedOut commander cards to DeckList");
    const commanderCards = await tappedOut.getCards();
    for (const card of commanderCards) {
      card.setDeck();
    }
    deckList.join(commanderCards);

    logger.verbose("adding TappedOut similar decks cards to DeckList");
    const similarDeckLinks = await tappedOut.getSimilarDeckLinks();
    for (const deckLink of similarDeckLinks) {
      try {
        await tappedOut.goto({
          url: deckLink,
          waitForSelector: Selector.TappedOut.CARD,
        });
        const cards = await tappedOut.getCards();
        deckList.attach({ deckLink, cards });
        deckList.join(cards);
      } catch (err) {
        logger.warn(err);
      }
    }

    logger.verbose("starting EDHRec");
    const edhRec = new EDHRec(this.manager.page, this.commanderQueryString);
    await edhRec.goto();

    logger.verbose("asking for EDHRec theme");
    await edhRec.selectTheme();

    logger.verbose("asking for EDHRec budget");
    await edhRec.selectBudget();

    logger.verbose("adding EDHRec cards to DeckList");
    const edhRecCards = await edhRec.getSuggestedCards();
    deckList.join(edhRecCards);

    logger.verbose("creating report");
    const reporter = new Reporter(this.commanderQueryString, deckList);
    await reporter.create();
  }
}
