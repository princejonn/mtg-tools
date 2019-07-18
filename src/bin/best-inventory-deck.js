import BestInventoryDeck from "components/BestInventoryDeck";
import InventoryService from "services/InventoryService";
//import ReporterService from "services/ReporterService";
import ScryfallService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import Spinners from "utils/Spinners";

export default async () => {
  const decks = [];

  try {
    Spinners.start("loading cache");
    await ScryfallService.load();

    Spinners.next("loading inventory");
    await InventoryService.load();

    Spinners.next("finding tapped-out links");
    const linkList = await TappedOutService.getTopLinks();

    Spinners.next("finding tapped-out decks");
    Spinners.setTotalTasks(linkList.links.length);
    for (const link of linkList.links) {
      Spinners.startTask();
      const { url, position } = link;
      const deck = await TappedOutService.getDeck(url);
      if (!deck) continue;
      deck.setPosition({ position });
      decks.push(deck);
    }

    Spinners.next("finding best deck in inventory");
    const bestInventoryDeck = new BestInventoryDeck();

    for (const deck of decks) {
      await bestInventoryDeck.addTappedOutDeck(deck);
    }

    await bestInventoryDeck.calculate();

    Spinners.succeed();

    console.log(`the best deck you can build, with [ ${bestInventoryDeck.bestAmount} ] cards in your inventory:\n >>> ${bestInventoryDeck.bestInventoryDeck.url}`);
  } catch (err) {
    Spinners.fail();
    console.error(err);
  } finally {
    process.exit(0);
  }
}
