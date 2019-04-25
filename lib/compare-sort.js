module.exports = (array, property, ascDesc) => {
  if (ascDesc !== "ASC" && ascDesc !== "DESC") {
    throw new Error("ASC/DESC required");
  }

  const compare = (a, b) => {
    if (a[property] < b[property]) {
      if (ascDesc === "ASC") {
        return -1;
      } else if (ascDesc === "DESC") {
        return 1;
      }
    }
    if (a[property] > b[property]) {
      if (ascDesc === "ASC") {
        return 1;
      } else if (ascDesc === "DESC") {
        return -1;
      }
    }
    return 0;
  };

  return array.sort(compare);
};
