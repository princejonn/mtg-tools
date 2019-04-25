const path = require("path");
const yaml = require("node-yaml");
const puppeteer = require("puppeteer");
const queryString = require("query-string");
const config = yaml.readSync(path.join(process.env.PWD, "config.yml"));

const Selector = {
  EdhRec: {
    CARD: "div.nw div.nwname",
  },
  TappedOut: {
    COMMANDER: "ul.boardlist > a",
    CARD: "ul.boardlist > li.member > span.card > a.card-link",
  },
};

/**
 * @param {string} url
 * @returns {Promise<Array>}
 */
const edhRec = async (url) => {
  console.log(`fetching cards from url: ${url}`);
  const browser = await puppeteer.launch({ visible: true });

  try {
    const page = await browser.newPage();
    await page.goto(url);

    const list = [];

    await page.waitForSelector(Selector.EdhRec.CARD);
    const elements = await page.$$(Selector.EdhRec.CARD);

    for (const element of elements) {
      const text = await page.evaluate(element => {
        return element.textContent;
      }, element);

      list.push(text);
    }

    browser.close();
    return list;
  } catch (err) {
    browser.close();
    throw err;
  }
};

/**
 * @param {string} url
 * @returns {Promise<Array>}
 */
const tappedOut = async (url) => {
  console.log(`fetching cards from url: ${url}`);
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(url);

    const cards = await _getTappedOutCards(page);

    browser.close();
    return cards;
  } catch (err) {
    browser.close();
    throw err;
  }
};

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
const findCommanderLinkByName = async (name) => {
  const browser = await puppeteer.launch();

  try {
    const parsed = queryString.parse(name);
    const replaced = queryString.stringify(parsed);
    const search = `http://tappedout.net/mtg-cards/search/?name=${replaced}&o=name_sort&mana_cost=&mana_cost_converted_0=&mana_cost_converted_1=&rules=&subtype=&formats=&blocks=&rarity=`;
    const page = await browser.newPage();
    await page.goto(search);
    await page.waitForSelector("span.card a.card-link", { visible: true });

    const elements = await page.$$("span.card a.card-link");
    const element = elements[0];
    const commander = await _getNameFromElementHref(page, element);

    browser.close();
    return commander;
  } catch (err) {
    browser.close();
    throw err;
  }
};

/**
 * @param {string} commander
 * @returns {Promise<Array>}
 */
const getPopularCommanderCards = async (commander) => {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    await _login(page);

    console.log(`searching for commander decks: ${commander}`);

    const deckList = await _findCommanderDecks(page, commander);

    let cards = [];

    for (const url of deckList) {
      const array = await tappedOut(url);
      cards = cards.concat(array);
    }

    browser.close();
    return cards;
  } catch (err) {
    browser.close();
    throw err;
  }
};

const improveCommanderDeck = async (url) => {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    await _login(page);

    console.log(`going to commander link: ${url}`);
    await page.goto(url);
    await page.waitForSelector(Selector.TappedOut.CARD, { visible: true });

    console.log("finding commander");
    const element = await page.$(Selector.TappedOut.COMMANDER);
    const commander = await _getNameFromElementHref(page, element);

    console.log("finding commander deck");
    const currentDeck = await _getTappedOutCards(page);

    console.log(`searching for commander decks: ${commander}`);
    const deckLinks = await _findCommanderDecks(page, commander);

    browser.close();
    return { commander, currentDeck, deckLinks };
  } catch (err) {
    browser.close();
    throw err;
  }
};

/**
 * @param {object} page
 * @returns {Promise<void>}
 * @private
 */
const _login = async (page) => {
  console.log(`logging in to tapped out to be able to search`);
  await page.goto("https://tappedout.net/accounts/login/?next=/");
  const username = config.tappedOut.username;
  const password = config.tappedOut.password;
  await page.type("input#id_username", username);
  await page.type("input#id_password", password);
  await page.click("input.submit");
  await page.waitForSelector("div.tabbable ul.nav li.active", { visible: true });
};

/**
 * @param {object} page
 * @param {object} element
 * @returns {Promise<string>}
 * @private
 */
const _getNameFromElementHref = async (page, element) => {
  const attribute = "href";

  const url = await page.evaluate((element, attribute) => {
    return element.getAttribute(attribute);
  }, element, attribute);

  console.log(`found commander url: ${url}`);

  const split = url.split("/mtg-card/");
  const name = split[1].slice(0, -1);

  console.log(`found name: ${name}`);

  return name;
};

/**
 * @param {object} page
 * @returns {Promise<Array>}
 * @private
 */
const _getTappedOutCards = async (page) => {
  const list = [];

  await page.waitForSelector(Selector.TappedOut.CARD);
  const elements = await page.$$(Selector.TappedOut.CARD);

  for (const element of elements) {
    const attribute = "data-name";

    const name = await page.evaluate((element, attribute) => {
      return element.getAttribute(attribute);
    }, element, attribute);

    list.push(name);
  }

  return list;
};

/**
 * @param {object} page
 * @param {string} commander
 * @returns {Promise<Array>}
 * @private
 */
const _findCommanderDecks = async (page, commander) => {
  await page.goto(`https://tappedout.net/mtg-decks/search/?q=&format=edh&general=${commander}&price_0=&price_1=&o=-rating&submit=Filter+results`);
  await page.waitForSelector("ul.pagination li.active", { visible: true });
  const elements = await page.$$("h3.deck-wide-header a");

  const list = [];

  console.log(`finding links`);

  for (const element of elements) {
    const attribute = "href";

    const url = await page.evaluate((element, attribute) => {
      return element.getAttribute(attribute);
    }, element, attribute);

    console.log(`found url: ${url}`);

    list.push(`https://tappedout.net${url}`);
  }

  return list;
};

module.exports = {
  edhRec,
  tappedOut,
  findCommanderLinkByName,
  getPopularCommanderCards,
  improveCommanderDeck,
};
