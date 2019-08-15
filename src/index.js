#!/usr/bin/env node

import program from "commander";
import packageJson from "#/package.json";
import bestInventoryDeck from "bin/best-inventory-deck";
import cardMarket from "bin/card-market";
import clear from "bin/clear";
import deckDiff from "bin/deck-diff";
import improve from "bin/improve";
import inventory from "bin/inventory";
import login from "bin/login";
import recommend from "bin/recommend";
import shareLinks from "bin/share-links";


//
// Improving your deck
//


program
  .command("best-inventory")
  .alias("b")
  .description("Compares your inventory to all top decks and returns where you have most owned cards.")

  .action(async () => {
    await bestInventoryDeck();
  });

program
  .command("diff")
  .alias("d")
  .description("Showing difference in cards between two decks.")
  .arguments("<urls...>")

  .action(async (urls) => {
    await deckDiff(urls);
  });


program
  .command("improve")
  .alias("i")
  .description("Finds card improvements to your existing deck.")
  .arguments("<url>")

  .option("-t, --theme [theme]", "using edh-rec theme by number")
  .option("-g, --budget [budget]", "using tapped-out budget by number")
  .option("-b, --hubs [hubs]", "using hubs by comma separated strings")
  .option("-e, --inventory [inventory]", "using only cards from the inventory")
  .option("-p, --top [top]", "using only top decks from tapped-out")
  .option("-c, --cards [cards]", "searching tapped-out for decks containing specific cards")

  .action(async (url, cmd) => {
    await improve({
      url,
      theme: cmd.theme,
      budget: cmd.budget,
      hubs: cmd.hubs,
      inventory: cmd.inventory,
      top: cmd.top,
      cards: cmd.cards,
    });
  });


program
  .command("recommend")
  .alias("r")
  .description("Creates a starting recommendation for a commander to build on.")
  .arguments("<name>")

  .option("-t, --theme [theme]", "using edh-rec theme by number")
  .option("-g, --budget [budget]", "using tapped-out budget by number")
  .option("-b, --hubs [hubs]", "using hubs by comma separated strings")
  .option("-e, --inventory [inventory]", "using only cards from the inventory")
  .option("-p, --top [top]", "using only top decks from tapped-out")
  .option("-c, --cards [cards]", "searching tapped-out for decks containing specific cards")

  .action(async (name, cmd) => {
    await recommend({
      name,
      theme: cmd.theme,
      budget: cmd.budget,
      hubs: cmd.hubs,
      inventory: cmd.inventory,
      top: cmd.top,
      cards: cmd.cards,
    });
  });


//
// Utility
//


program
  .command("card-market")
  .alias("m")
  .description("Returns a deck/shopping list based on your inventory and the input.")
  .arguments("<urls...>")

  .action(async (urls) => {
    await cardMarket(urls);
  });


program
  .command("clear")
  .alias("c")
  .description("Clearing all cached data")

  .action(async () => {
    await clear();
  });


program
  .command("inventory")
  .alias("e")
  .description("Saves your inventory to database.")
  .arguments("<file>")

  .option("-n, --name-key [nameKey]", "title for card name in csv")
  .option("-a, --amount-key [amountKey]", "title for amount in csv")

  .action(async (file, cmd) => {
    await inventory(file, cmd.nameKey, cmd.amountKey);
  });


program
  .command("login")
  .alias("l")
  .description("Saves your tapped out login information (hashed) to database.")

  .action(async () => {
    await login();
  });


program
  .command("share-links")
  .alias("s")
  .description("Saves your tapped out share links so that you can use the normal URL but still use the share link for the tool.")
  .arguments("<urls...>")

  .action(async (urls) => {
    await shareLinks(urls);
  });


//
// Setup
//


program
  .version(packageJson.version, "-v, --version")
  .parse(process.argv);

if (program.args.length === 0) {
  // e.g. display usage
  program.help();
}
