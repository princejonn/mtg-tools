import _ from "lodash";
import SortBy from "enums/SortBy";
import DomainTypeError from "errors/DomainTypeError";

export default class ArraySort {
  /**
   * @param {Array} array
   * @param {string} property
   * @param {string} ascDesc
   * @returns {array}
   */
  static sortProperty(array, property, ascDesc) {
    if (!_.isArray(array)) {
      throw new DomainTypeError({ array });
    }
    if (!_.isString(property)) {
      throw new DomainTypeError({ property });
    }
    if (ascDesc !== SortBy.ASC && ascDesc !== SortBy.DESC) {
      throw new DomainTypeError({ ascDesc });
    }

    const compare = (a, b) => {
      if (a[property] < b[property]) {
        if (ascDesc === SortBy.ASC) {
          return -1;
        } if (ascDesc === SortBy.DESC) {
          return 1;
        }
      }
      if (a[property] > b[property]) {
        if (ascDesc === SortBy.ASC) {
          return 1;
        } if (ascDesc === SortBy.DESC) {
          return -1;
        }
      }
      return 0;
    };

    return array.sort(compare);
  }
}
