const puppeteer = require('puppeteer');

/**
 * @param {string} url
 * @returns {Promise<Array>}
 */
const edhRec = async url => {
  const browser = await puppeteer.launch();
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

module.exports = {
  edhRec,
  tappedOut,
};
