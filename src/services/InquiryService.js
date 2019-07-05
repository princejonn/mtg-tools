import inquirer from "inquirer";
import inquirerCheckboxPlusPrompt from "inquirer-checkbox-plus-prompt";
import find from "lodash/find";
import isString from "lodash/isString";
import * as fuzzy from "fuzzy";
import BudgetChoice from "enums/BudgetChoice";
import InventoryChoice from "enums/InventoryChoice";
import TopDeckChoice from "enums/TopDeckChoice";
import EDHRecTheme from "models/EDHRecTheme";
import ProgramInventoryChoice from "models/ProgramInventoryChoice";
import TappedOutBudget from "models/TappedOutBudget";
import TappedOutTopDeck from "models/TappedOutTopDeck";
import AccountService from "services/AccountService";
import EDHRecService from "services/EDHRecService";
import ScryfallService from "services/ScryfallService";
import TappedOutService from "services/TappedOutService";
import searchString from "utils/SearchString";

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
   * @param {boolean} saveLogin
   * @returns {Promise<TappedOutAccount>}
   */
  static async loginAccount(saveLogin = false) {
    const exists = await AccountService.get();

    if (exists) {
      return exists;
    }

    const { username, password } = await inquirer.prompt(loginForm);

    if (!isString(username)) {
      throw new Error("username undefined");
    }
    if (!isString(password)) {
      throw new Error("password undefined");
    }

    if (saveLogin) {
      await AccountService.save(username, password);
    }

    return AccountService.build(username, password);
  }

  /**
   * @param {Commander} commander
   * @param {string} programOption
   * @returns {Promise<EDHRecTheme>}
   */
  static async selectTheme(commander, programOption) {
    const themeList = await EDHRecService.getThemeList(commander);

    if (isString(programOption)) {
      const exists = find(themeList, { num: parseInt(programOption, 10) });
      if (exists) {
        return new EDHRecTheme(exists);
      }
    }

    const choices = InquiryService._listChoices(themeList);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to select a theme?",
      pageSize: 10,
      choices,
    } ]);

    const data = find(themeList, { text });
    return new EDHRecTheme(data);
  }

  /**
   * @param {string} programOption
   * @returns {Promise<TappedOutBudget>}
   */
  static async selectBudget(programOption) {
    if (isString(programOption)) {
      const exists = find(BudgetChoice, { num: parseInt(programOption, 10) });
      if (exists) {
        return new TappedOutBudget(exists);
      }
    }

    const choices = InquiryService._listChoices(BudgetChoice);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to select a budget?",
      pageSize: 10,
      choices,
    } ]);

    const data = find(BudgetChoice, { text });
    return new TappedOutBudget(data);
  }

  /**
   * @param {string} programOption
   * @returns {Promise<ProgramInventoryChoice>}
   */
  static async selectInventory(programOption) {
    if (isString(programOption)) {
      const exists = find(InventoryChoice, { num: parseInt(programOption, 10) });
      if (exists) {
        return new ProgramInventoryChoice(exists);
      }
    }

    const choices = InquiryService._listChoices(InventoryChoice);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to use cards only in your inventory?",
      choices,
    } ]);

    const data = find(InventoryChoice, { text });
    return new ProgramInventoryChoice(data);
  }

  /**
   * @param {string} programOption
   * @returns {Promise<TappedOutTopDeck>}
   */
  static async selectTopDeck(programOption) {
    if (isString(programOption)) {
      const exists = find(TopDeckChoice, { num: parseInt(programOption, 10) });
      if (exists) {
        return new TappedOutTopDeck(exists);
      }
    }

    const choices = InquiryService._listChoices(TopDeckChoice);

    const { text } = await inquirer.prompt([ {
      type: "list",
      name: "text",
      message: "Do you want to use only top decks for recommendation?",
      choices,
    } ]);

    const data = find(TopDeckChoice, { text });
    return new TappedOutTopDeck(data);
  }

  /**
   * @param {string} programOption
   * @returns {Promise<string>}
   */
  static async selectHubs(programOption) {
    if (isString(programOption)) {
      return programOption;
    }

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

  /**
   * @param {string} programOption
   * @returns {Promise<string>}
   */
  static async selectCards(programOption) {
    if (isString(programOption)) {
      return programOption;
    }

    const hubsList = ScryfallService.getNames();

    const { list } = await inquirer.prompt([ {
      type: "checkbox-plus",
      name: "list",
      message: "Select three (3) cards for Tapped Out filtering if you wish",
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

    const output = [];

    for (const name of list) {
      output.push(searchString(name));
    }

    const length = output.length <= 3 ? output.length : 3;
    const sliced = output.slice(0, length);

    return sliced.join(",");
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
