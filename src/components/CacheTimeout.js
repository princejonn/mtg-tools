import DateFns from "components/DateFns";

export default class CacheTimeout {
  /**
   * @param {number} [years]
   * @param {number} [months]
   * @param {number} [days]
   * @param {number} [hours]
   * @param {number} [minutes]
   * @param {number} [seconds]
   */
  constructor({ years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 }) {
    this.options = { years, months, days, hours, minutes, seconds };
  }

  /**
   * @param {string} date
   */
  isOK(date) {
    const now = DateFns.now();
    const created = DateFns.get(new Date(date));
    const timeout = DateFns.add(created, this.options);
    return DateFns.isBefore(now, timeout);
  }
}
