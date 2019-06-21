import readline from "readline";
import { find } from "lodash";

export default class ReadLineService {
  /**
   * @param {EDHRecThemeList} themeList
   * @returns {Promise<string>}
   */
  static async selectTheme(themeList) {
    const { question, allowedAnswers } = await ReadLineService._buildQuestion(themeList);

    let exitCondition = 10;

    while (exitCondition > 0) {
      exitCondition -= 1;

      console.log(question);

      const answer = await ReadLineService._readLine();
      const number = parseInt(answer, 10);
      const allowed = find(allowedAnswers, { num: number });

      if (!allowed) {
        console.log("\nError: answer is not in list\n");
        continue;
      }

      return allowed.url;
    }

    throw new Error("could not answer correctly in 10 tries. exiting application.");
  }

  /**
   * @param {EDHRecThemeList} themeList
   * @returns {Promise<{question: string, allowedAnswers: Array<{num: number, url: string}>}>}
   * @private
   */
  static async _buildQuestion(themeList) {
    let question = "Select a theme/budget if you want:\n";
    let allowedAnswers = [];
    let num = 0;
    let length = 0;

    for (const item of themeList.themes) {
      const { theme } = item;
      if (theme.length > length) {
        length = theme.length;
      }
    }

    for (const item of themeList.themes) {
      const { theme, url, type } = item;
      question += `  ${num.toString().padEnd(2)} : ${theme.padEnd(length + 2)} (${type})\n`;
      allowedAnswers.push({ num, url });
      num += 1;
    }

    return { question, allowedAnswers };
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

    return new Promise(resolve => rl.question(`\nanswer: `, answer => {
      rl.close();
      resolve(answer);
    }));
  }
}
