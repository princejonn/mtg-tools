const yaml = require('node-yaml');
const puppeteer = require('puppeteer');
const config = yaml.readSync('./config.yml');

/**
 * @param {string} url
 * @returns {Promise<Array>}
 */
const edhRec = async url => {
  console.log(` fetching cards from url: ${url}`);
  const browser = await puppeteer.launch({ visible: true });

  try {
    const page = await browser.newPage();
    await page.goto(url);

    const list = [];

    const selector = 'div.nw div.nwname';
    await page.waitForSelector(selector);
    const elements = await page.$$(selector);

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
const tappedOut = async url => {
  console.log(` fetching cards from url: ${url}`);
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(url);

    const list = [];

    const selector = 'li.member span.card a.card-link';
    await page.waitForSelector(selector);
    const elements = await page.$$(selector);

    for (const element of elements) {
      const attribute = 'data-name';

      const name = await page.evaluate((element, attribute) => {
        return element.getAttribute(attribute);
      }, element, attribute);

      list.push(name);
    }

    browser.close();
    return list;
  } catch (err) {
    browser.close();
    throw err;
  }
};

const searchTappedOut = async commander => {
  const browser = await puppeteer.launch();

  try {
    const username = config.tappedOut.username;
    const password = config.tappedOut.password;
    console.log(` logging in to tapped out to be able to search`);

    const page = await browser.newPage();
    await page.goto('https://tappedout.net/accounts/login/?next=/');

    await page.type('input#id_username', username);
    await page.type('input#id_password', password);
    await page.click('input.submit');
    await page.waitForSelector('div.tabbable ul.nav li.active', { visible: true });

    console.log(` searching for commander: ${commander}`);

    const general = commander.replace(' ', '-');
    await page.goto(`https://tappedout.net/mtg-decks/search/?q=&format=edh&general=${general}&price_0=&price_1=&o=-rating&submit=Filter+results`);
    await page.waitForSelector('ul.pagination li.active', { visible: true });
    const elements = await page.$$('h3.deck-wide-header a');

    const list = [];
    let cards = [];

    console.log(` finding links`);

    for (const element of elements) {
      const attribute = 'href';

      const url = await page.evaluate((element, attribute) => {
        return element.getAttribute(attribute);
      }, element, attribute);

      console.log(` found url: ${url}`);

      list.push(`https://tappedout.net${url}`);
    }

    for (const url of list) {
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

module.exports = {
  edhRec,
  tappedOut,
  searchTappedOut,
};
