import _ from "lodash";

export const SortBy = {
  ASCENDING: "ASC",
  DESCENDING: "DESC",
};

/**
 * @param {Array} arrayOfObjects
 * @param {string} sortByPath
 * @param {string} sortDirection
 * @returns {array}
 */
export default (arrayOfObjects, sortByPath, sortDirection) => {
  if (!_.isArray(arrayOfObjects)) {
    throw new Error("array is undefined");
  }
  if (!_.isString(sortByPath)) {
    throw new Error("path is undefined");
  }
  if (sortDirection !== SortBy.ASCENDING && sortDirection !== SortBy.DESCENDING) {
    throw new Error("ascDesc is undefined");
  }

  const compare = (a, b) => {
    if (_.get(a, sortByPath) < _.get(b, sortByPath)) {
      if (sortDirection === SortBy.ASCENDING) {
        return -1;
      } if (sortDirection === SortBy.DESCENDING) {
        return 1;
      }
    }
    if (_.get(a, sortByPath) > _.get(b, sortByPath)) {
      if (sortDirection === SortBy.ASCENDING) {
        return 1;
      } if (sortDirection === SortBy.DESCENDING) {
        return -1;
      }
    }
    return 0;
  };

  return arrayOfObjects.sort(compare);
};
