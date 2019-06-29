import path from "path";
import NReadLines from "n-readlines";
import CSVtoJSON from "csvtojson";
import latinise from "utils/Latinise";
import TimerMessage from "./TimerMessage";

const returnCsv = async (file, nameKey = "Name", amountKey = "Quantity") => {
  const cards = {};

  const jsonArray = await CSVtoJSON().fromFile(file);

  for (const card of jsonArray) {
    const name = latinise(card[nameKey].trim());
    const amount = parseInt(card[amountKey], 10);

    if (!cards[name]) {
      cards[name] = 0;
    }

    cards[name] += amount;
  }

  return cards;
};

const returnLines = async file => {
  const cards = {};

  const nReadLines = new NReadLines(file);
  let buffer = nReadLines.next();

  while (buffer) {
    const line = buffer.toString();

    if (!line[0].match(/\d+/)) {
      throw new Error(`line does not start with a digit [ ${line} ]`);
    }

    const amount = parseInt(line.match(/\d+/)[0], 10);
    const split = line.split(/\d+/);
    let text = split[1];

    if (text[0] === "x") {
      text = text.slice(1).trim();
    }

    text = text.replace(/\t/g, "").trim();
    text = latinise(text);

    if (!cards[text]) {
      cards[text] = 0;
    }

    cards[text] += amount;

    buffer = nReadLines.next();
  }

  return cards;
};

/**
 * @param {string} file
 * @param {string} [nameKey]
 * @param {string} [amountKey]
 * @returns {Promise<*>}
 */
export default async (file, nameKey, amountKey) => {
  const ext = path.extname(file);
  const timerMessage = new TimerMessage("loading file");

  if (ext === ".csv") {
    const result = returnCsv(file, nameKey, amountKey);
    timerMessage.done();
    return result;
  }

  if (ext === ".txt") {
    const result = returnLines(file);
    timerMessage.done();
    return result;
  }

  throw new Error("unsupported format. only [ .csv | .txt ] files allowed");
};
