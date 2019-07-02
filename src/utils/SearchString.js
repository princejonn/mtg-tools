import latinise from "utils/Latinise";

/**
 * @param {string} text
 * @returns {string}
 */
export default (text) => {
  return latinise(text)
    .replace(/\s/g, "-")
    .replace(/\'/g, "")
    .replace(/\,/g, "")
    .toLowerCase();
};
