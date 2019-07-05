#!/usr/bin/env node

import program from "commander";
import packageJson from "#/package.json";
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
  .command("diff")
  .alias("d")
  .description("Compares two deck lists against each other. Outputting the difference in cards between the two. This way you can take your deck and compare it to competitive primer decks for instance.")
  .arguments("<urls...>")

  .action(async (urls) => {
    await deckDiff(urls);
  });


program
  .command("improve")
  .alias("i")
  .description("Tries to find improvements for your current commander deck by walking through EDHRec, and the top 100 TappedOut deck lists for the same commander.")
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
  .description("Tries to create a good starting point for a commander. By inputting the name (remember using quotes), you will get a recommendation based on average types used, much in the same format as improve.")
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
  .description("By using your inventory and the actual card amounts in your inventory, you can create a decklist for card market, which will contain only the cards you don't currently own, so that you can simply paste them into a wants list and move on from there.")
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
  .description("Imports your inventory and saves it to the local database so that you can create reports with information about whether or not you have the recommended card or not.")
  .arguments("<file>")

  .option("-n, --name-key [nameKey]", "title for card name in csv")
  .option("-a, --amount-key [amountKey]", "title for amount in csv")

  .action(async (file, cmd) => {
    await inventory(file, cmd.nameKey, cmd.amountKey);
  });


program
  .command("login")
  .alias("l")
  .description("Saves your TappedOut login information (thinly hashed) to the local database/cache. This is only security by obscurity and I do recommend you don't use this if you feel your information is sensitive.")

  .action(async () => {
    await login();
  });


program
  .command("share-links")
  .alias("s")
  .description("It is possible to create private share links in TappedOut by clicking the Export button. If you use this link with this command, you will have the share link saved in the local database, and then you only have to use the normal deck URL in the future.")
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
