import NReadLines from "n-readlines";
import latinise from "utils/Latinise";

export default async file => {
  const nReadLines = new NReadLines(file);
  let buffer = nReadLines.next();

  const cards = {};

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
