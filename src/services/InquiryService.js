import inquirer from "inquirer";
import inquirerCheckboxPlusPrompt from "inquirer-checkbox-plus-prompt";
import find from "lodash/find";
import * as fuzzy from "fuzzy";
import BudgetList from "enums/BudgetList";
import EDHRecTheme from "models/EDHRecTheme";
import EDHRecService from "services/EDHRecService";
import TappedOutBudget from "models/TappedOutBudget";
import TappedOutService from "services/TappedOutService";

inquirer.registerPrompt("checkbox-plus", inquirerCheckboxPlusPrompt);

const loginForm = [
  {
    type: "input",
    name: "username",
    message: "Enter username",
  },
  {
    type: "password",
    name: "password",
    message: "Enter password",
    mask: "*",
  },
];

export default class InquiryService {
  /**
   * @returns {Promise<void>}
   */
  static async loginForm() {
    return inquirer.prompt(loginForm);
  }

  /**
   * @param commander
   * @returns {Promise<EDHRecTheme>}
   */
  static async selectTheme(commander) {
    const themeList = await EDHRecService.getThemeList(commander);
    const choices = InquiryService._listChoices(themeList);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to select a theme?",
      choices,
    } ]);

    const data = find(themeList, { text });
    return new EDHRecTheme(data);
  }

  /**
   * @returns {Promise<TappedOutBudget>}
   */
  static async selectBudget() {
    const choices = InquiryService._listChoices(BudgetList);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to select a budget?",
      choices,
    } ]);

    const data = find(BudgetList, { text });
    return new TappedOutBudget(data);
  }

  /**
   * @returns {Promise<string>}
   */
  static async selectHubs() {
    const hubsList = await TappedOutService.getValidHubs();

    const { list } = await inquirer.prompt([ {
      type: "checkbox-plus",
      name: "list",
      message: "Select hubs for Tapped Out filtering if you wish",
      pageSize: 10,
      highlight: true,
      searchable: true,
      source: (answersSoFar, input) => {
        input = input || "";
        return new Promise((resolve) => {
          const fuzzyResult = fuzzy.filter(input, hubsList);
          const data = fuzzyResult.map((element) => {
            return element.original;
          });
          resolve(data);
        });
      },
    } ]);

    return list.join(",");
  }

  static _listChoices(list) {
    const typedList = {};
    const array = [];

    for (const item of list) {
      const { text, type } = item;
      if (!typedList[type]) {
        typedList[type] = [];
      }
      typedList[type].push(text);
    }

    for (const key in typedList) {
      if (!typedList.hasOwnProperty(key)) continue;
      const objects = typedList[key];
      for (const item of objects) {
        array.push(item);
      }
      array.push(new inquirer.Separator());
    }

    return array;
  }
}
