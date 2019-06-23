const CamelCaser = object => {
  const newObject = {};
  let originalKey;
  let newKey;
  let value;

  if (object instanceof Array) {
    return object.map(objectValue => {
      if (typeof objectValue === "object") {
        objectValue = CamelCaser(objectValue);
      }
      return objectValue;
    });
  }

  for (originalKey in object) {
    if (!object.hasOwnProperty(originalKey)) continue;

    newKey = (originalKey.charAt(0).toLowerCase() + originalKey.slice(1) || originalKey).toString();
    value = object[originalKey];

    if (value instanceof Array || (value !== null && value.constructor === Object)) {
      value = CamelCaser(value);
    }

    newObject[newKey] = value;
  }


  return newObject;
};

export default CamelCaser;
