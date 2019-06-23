import readline from "readline";
import { find } from "lodash";
import EDHRecTheme from "models/EDHRecTheme";

export default class ReadLineService {
  /**
   * @param {EDHRecThemeList} themeList
   * @returns {Promise<EDHRecTheme>}
   */
  static async selectTheme(themeList) {
    const question = await ReadLineService._buildQuestion(themeList);

    let exitCondition = 10;

    while (exitCondition > 0) {
      exitCondition -= 1;

      console.log(question);

      const answer = await ReadLineService._readLine();
      const number = parseInt(answer, 10);
      const allowed = find(themeList.themes, { num: number });

      if (!allowed) {
        console.log("\nError: answer is not in list\n");
        continue;
      }

      return new EDHRecTheme(allowed);
    }

    throw new Error("could not answer correctly in 10 tries. exiting application.");
  }

  /**
   * @param {EDHRecThemeList} themeList
   * @returns {Promise<string>}
   * @private
   */
  static async _buildQuestion(themeList) {
    const { themes } = themeList;
    let question = "\n\nSelect a theme/budget if you want:\n";
    let padLength = 0;

    for (const item of themes) {
      const { theme } = item;
      const { length } = theme;
      if (length > padLength) {
        padLength = length;
      }
    }

    for (const item of themes) {
      const { theme, type, num } = item;
      question += `  ${num.toString().padEnd(2)} : ${theme.padEnd(padLength + 2)} (${type})\n`;
    }

    return question;
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
