import dateFns from "date-fns";
import { parseFromTimeZone } from "date-fns-timezone";

export default class DateFns {
  /**
   * @param {Date} date
   * @returns {Date}
   */
  static get(date = new Date()) {
    return parseFromTimeZone(date, { timeZone: "Europe/Stockholm" });
  }

  /**
   * @param {Date} date
   * @param {string} format
   * @returns {string}
   */
  static format(date, format) {
    return dateFns.format(date, format);
  }

  /**
   * @returns {Date}
   */
  static now() {
    return DateFns.get();
  }

  /**
   * @param {Date} date
   * @param {number} [years]
   * @param {number} [months]
   * @param {number} [days]
   * @param {number} [hours]
   * @param {number} [minutes]
   * @param {number} [seconds]
   */
  static add(date, { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 }) {
    let added = DateFns.get(date);
    added = dateFns.addYears(added, years);
    added = dateFns.addMonths(added, months);
    added = dateFns.addDays(added, days);
    added = dateFns.addHours(added, hours);
    added = dateFns.addMinutes(added, minutes);
    added = dateFns.addSeconds(added, seconds);
    return added;
  }

  /**
   * @param {Date} date
   * @param {Date} comparisonDate
   * @returns {boolean}
   */
  static isBefore(date, comparisonDate) {
    return dateFns.isBefore(date, comparisonDate);
  }
}
