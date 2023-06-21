export const uint8ArrayToString = (uint8Array: Uint8Array): string => {
  let charArray = [];
  for (let i = 0; i < uint8Array.length; i++) {
    charArray.push(String.fromCharCode(uint8Array[i]));
  }
  return charArray.join("");
};

export const stringToUint8Array = (str: string): Uint8Array => {
  let uint8Array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }
  return uint8Array;
};
