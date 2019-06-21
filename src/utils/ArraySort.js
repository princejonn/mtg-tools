import _ from "lodash";
import DomainTypeError from "errors/DomainTypeError";

export const SortBy = {
  ASCENDING: "ASC",
  DESCENDING: "DESC",
};

export default class ArraySort {
  /**
   * @param {Array} array
   * @param {string} path
   * @param {string} ascDesc
   * @returns {array}
   */
  static sortProperty(array, path, ascDesc) {
    if (!_.isArray(array)) {
      throw new DomainTypeError({ array });
    }
    if (!_.isString(path)) {
      throw new DomainTypeError({ path });
    }
    if (ascDesc !== SortBy.ASCENDING && ascDesc !== SortBy.DESCENDING) {
      throw new DomainTypeError({ ascDesc });
    }

    const compare = (a, b) => {
      if (_.get(a, path) < _.get(b, path)) {
        if (ascDesc === SortBy.ASCENDING) {
          return -1;
        } if (ascDesc === SortBy.DESCENDING) {
          return 1;
        }
      }
      if (_.get(a, path) > _.get(b, path)) {
        if (ascDesc === SortBy.ASCENDING) {
          return 1;
        } if (ascDesc === SortBy.DESCENDING) {
          return -1;
        }
      }
      return 0;
    };

    return array.sort(compare);
  }
}
