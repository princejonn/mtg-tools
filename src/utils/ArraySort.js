import _ from "lodash";

export const SortBy = {
  ASCENDING: "ASC",
  DESCENDING: "DESC",
};

/**
 * @param {Array} array
 * @param {string} path
 * @param {string} ascDesc
 * @returns {array}
 */
export default (array, path, ascDesc) => {
  if (!_.isArray(array)) {
    throw new Error("array is undefined");
  }
  if (!_.isString(path)) {
    throw new Error("path is undefined");
  }
  if (ascDesc !== SortBy.ASCENDING && ascDesc !== SortBy.DESCENDING) {
    throw new Error("ascDesc is undefined");
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
};
