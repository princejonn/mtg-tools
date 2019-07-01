#!/usr/bin/env node

import program from "commander";
import packageJson from "#/package.json";
import clear from "bin/clear";
import improve from "bin/improve";
import inventory from "bin/inventory";
import login from "bin/login";
import recommend from "bin/recommend";

program
  .command("clear")
  .alias("c")
  .description("resetting all cached data")

  .action(async () => {
    await clear();
  });

program
  .command("improve")
  .alias("i")
  .description("improving your commander deck")
  .arguments("<url>")

  .option("-t, --theme [theme]", "using edh-rec theme by number")
  .option("-g, --budget [budget]", "using tapped-out budget by number")
  .option("-b, --hubs [hubs]", "using hubs by comma separated strings")
  .option("-e, --inventory [inventory]", "using only cards from the inventory")
  .option("-p, --top [top]", "using only top decks from tapped-out")

  .option("-l, --login", "forcing program to use the login form")

  .action(async (url, cmd) => {
    await improve({
      url,
      theme: cmd.theme,
      budget: cmd.budget,
      hubs: cmd.hubs,
      inventory: cmd.inventory,
      top: cmd.top,
      forceLogin: cmd.login,
    });
  });

program
  .command("inventory")
  .alias("e")
  .description("loading your inventory into the database")
  .arguments("<file>")

  .option("-n, --name [name]", "title for card name in csv")
  .option("-a, --amount [amount]", "title for amount in csv")

  .action(async (file, cmd) => {
    await inventory(file, cmd.name, cmd.amount);
  });

program
  .command("login")
  .alias("l")
  .description("saving your TappedOut username and password to cache")

  .action(async () => {
    await login();
  });

program
  .command("recommend")
  .alias("r")
  .description("recommending a deck for your commander")
  .arguments("<name>")

  .option("-t, --theme [theme]", "using edh-rec theme by number")
  .option("-g, --budget [budget]", "using tapped-out budget by number")
  .option("-b, --hubs [hubs]", "using hubs by comma separated strings")
  .option("-e, --inventory [inventory]", "using only cards from the inventory")
  .option("-p, --top [top]", "using only top decks from tapped-out")

  .action(async (name, cmd) => {
    await recommend({
      name,
      theme: cmd.theme,
      budget: cmd.budget,
      hubs: cmd.hubs,
      inventory: cmd.inventory,
      top: cmd.top,
    });
  });


program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log("  $ mtg-tools i https://tapped-out-link -t 0");
  console.log("  $ mtg-tools i https://tapped-out-link --theme 0");
  console.log("  $ mtg-tools i https://tapped-out-link -g 0");
  console.log("  $ mtg-tools i https://tapped-out-link --budget 4");
  console.log("  $ mtg-tools i https://tapped-out-link -b 0");
  console.log("  $ mtg-tools i https://tapped-out-link --hubs vampires,artifact");
  console.log("");
  console.log("  $ mtg-tools e /path/to/file.csv -n Name");
  console.log("  $ mtg-tools e /path/to/file.csv --name Name");
  console.log("  $ mtg-tools e /path/to/file.csv -a Quantity");
  console.log("  $ mtg-tools e /path/to/file.csv --amount Quantity");
});

program
  .version(packageJson.version, "-v, --version")
  .parse(process.argv);

if (program.args.length === 0) {
  // e.g. display usage
  program.help();
}
