# mtg-tools
EDH/Commander tools for Magic: The Gathering

## Installation

```
npm install -g mtg-tools
```

## What it does
This tool is meant to help rookies (like myself) create strong EDH/Commander decks through the power of automation. It utilizes EDHRec and TappedOut to find the best recommendations and the best cards suited for a commander or a commander deck. It builds a fancy HTML report at the end which will display card images and data (fetched from Scryfall).

## Local DB/Cache
By using a local database (NeDB), it's possible to cache a lot of things to make most requests quicker. The Scryfall default database is saved on disk. All TappedOut deck lists are saved and cached, as well as all EDHRec commander recommendations. They all have a cache timeout, so don't worry about the data going stale!

## TappedOut
This tool currently only supports TappedOut decks. I am considering adding others, but only if there's anyone asking for it.

## Improving your deck

### Diff
```
mtg-tools diff <deck-url> <comparison-url>

Example: mtg-tools d http://tappedout.net/mtg-decks/sorrynotsorry/ http://tappedout.net/mtg-decks/dominus-dreamcrusher-edition/ 
```
Compares two deck lists against each other. Outputting the difference in cards between the two. This way you can take your deck and compare it to competitive primer decks for instance.

### Improve
```
mtg-tools improve <deck-url>
mtg-tools improve --help

Example: mtg-tools i http://tappedout.net/mtg-decks/sorrynotsorry/
```
Tries to find improvements for your current commander deck by walking through EDHRec, and the top 100 TappedOut deck lists for the same commander.

### Recommend
```
mtg-tools recommend <commander-name>
mtg-tools recommend --help

Example: mtg-tools r "Yuriko, the Tiger's Shadow"
```
Tries to create a good starting point for a commander. By inputting the name (remember using quotes), you will get a recommendation based on average types used, much in the same format as `mtg-tools improve`.

## Utility
To make your life easier when building decks there are some utility commands as well.

### Card Market
```
mtg-tools card-market <urls...>

Example: mtg-tools m http://tappedout.net/mtg-decks/thisisadeck http://tappedout.net/mtg-decks/thisisalsoadeck http://tappedout.net/mtg-decks/thirddeck
```
By using your inventory and the actual card amounts in your inventory, you can create a decklist for card market, which will contain only the cards you don't currently own, so that you can simply paste them into a wants list and move on from there.

### Inventory
```
mtg-tools inventory <file>
mtg-tools inventory --help

Example: mtg-tools e /Users/strongbad/Downloads/MyCards.csv
```
Imports your inventory and saves it to the local database so that you can create reports with information about whether or not you have the recommended card or not. It's therefore also possible to use `mtg-tools improve` and `mtg-tools recommend` with the `--inventory` flag which will then only use cards you already have.

### Login
```
mtg-tools login
```
Saves your TappedOut login information (thinly hashed) to the local database/cache. This is only security by obscurity and I do recommend you don't use this if you feel your information is sensitive. If you're lazy like me it can be nice to not have to log in every time you want to use your private deck lists.

It is of course better then to use the tool below.

### Share Links
```
mtg-tools share-links <urls...>

Example: mtg-tools s http://tappedout.net/mtg-decks/thisisadeck/?share=82g82343j http://tappedout.net/mtg-decks/thisisalsoadeck/?share=sklfj8g2 
```
It is possible to create private share links in TappedOut by clicking the Export button. If you use this link with this command, you will have the share link saved in the local database, and then you only have to use the normal deck URL in the future. You only have to do this once as long as you don't regenerate the code. This is highly more recommended to do than saving your login information.
