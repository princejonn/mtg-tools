import readline from "readline";
import { find } from "lodash";
import EDHRecTheme from "models/EDHRecTheme";
import TappedOutBudget from "models/TappedOutBudget";

export default class ReadLineService {
  /**
   * @param {EDHRecThemeList} themeList
   * @returns {Promise<EDHRecTheme>}
   */
  static async selectTheme(themeList) {
    const question = await ReadLineService._buildQuestion("Select a EDHRec theme/budget if you want", themeList.themes);
    const data = await ReadLineService._buildLoop(question, themeList.themes);
    return new EDHRecTheme(data);
  }

  /**
   * @returns {Promise<TappedOutBudget>}
   */
  static async selectBudget() {
    const budgetList = [
      {
        text: "no budget",
        price: 5000,
        num: 0,
      },
      {
        text: "$100",
        price: 100,
        num: 1,
      },
      {
        text: "$200",
        price: 200,
        num: 2,
      },
      {
        text: "$300",
        price: 300,
        num: 3,
      },
      {
        text: "$400",
        price: 400,
        num: 4,
      },
      {
        text: "$500",
        price: 500,
        num: 5,
      },
    ];
    const question = await ReadLineService._buildQuestion("Select a TappedOut budget if you want", budgetList);
    const data = await ReadLineService._buildLoop(question, budgetList);
    return new TappedOutBudget(data);
  }

  /**
   * @param {string} prompt
   * @param {Array<{text: string, num: number, [type]: string}>} list
   * @returns {Promise<*>}
   * @private
   */
  static async _buildQuestion(prompt, list) {
    let question = `\n\n${prompt}:\n`;
    let padLength = 0;

    for (const item of list) {
      const { text } = item;
      const { length } = text;
      if (length > padLength) {
        padLength = length;
      }
    }

    for (const item of list) {
      const { text, num } = item;
      const type = item.type ? `(${item.type})` : "";
      question += `  ${num.toString().padEnd(2)} : ${text.padEnd(padLength + 2)} ${type}\n`;
    }

    return question;
  }

  /**
   * @param {string} question
   * @param {Array<object>} list
   * @returns {Promise<object>}
   * @private
   */
  static async _buildLoop(question, list) {
    let exitCondition = 10;

    while (exitCondition > 0) {
      exitCondition -= 1;

      console.log(question);

      const answer = await ReadLineService._readLine();
      const number = parseInt(answer, 10);
      const allowed = find(list, { num: number });

      if (!allowed) {
        console.log("\nError: answer is not in list\n");
        continue;
      }

      return allowed;
    }

    throw new Error("could not answer correctly after 10 tries. exiting application.");
  }

  /**
   * @returns {Promise<string>}
   * @private
   */
  static async _readLine() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => rl.question("\nanswer: ", answer => {
      rl.close();
      resolve(answer);
    }));
  }
}
