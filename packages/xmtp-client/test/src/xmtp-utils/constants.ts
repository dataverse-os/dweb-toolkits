export {}
export const MsgRecipient = "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"
export const MsgRecipient02 = "0xa508fd3A342806de31e0713EA7692Bde9d56Ba23"

export const MESSAGE_MODEL_ID = "kjzl6hvfrbw6cau4oac2by88mw5oyi4acvlwha4x2rnhok3wj7h7h1rf51p2xi4";
export const KEY_CACHE_MODEL_ID = "kjzl6hvfrbw6c9d4z2suv5gumrc3nj7r8o27sdz1x7d2g72bsjnyspkb15ewxpo";
export const APP_NAME = "xmtp_test04";

export const  uint8ArrayToString = (uint8Array: Uint8Array): string => {
  let charArray = [];
  for (let i = 0; i < uint8Array.length; i++) {
    charArray.push(String.fromCharCode(uint8Array[i]));
  }
  return charArray.join('');
}

export const stringToUint8Array = (str: string): Uint8Array => {
  let uint8Array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }
  return uint8Array;
}