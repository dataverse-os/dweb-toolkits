import {Conversation} from "@xmtp/xmtp-js";

export {}
export const MsgRecipient = "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"
export const MsgRecipient02 = "0x30C7832F3912e45C46F762F0D727F77B181d240D"


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

export const getConversationId = (conversation?: Conversation): string => {
  return conversation?.context?.conversationId
    ? `${conversation?.peerAddress}/${conversation?.context?.conversationId}`
    : conversation?.peerAddress ?? "";
};

export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export const uint8ArrayToObjUrl = (uint8Array: Uint8Array, mimeType: string): string => {
  const blob = new Blob([uint8Array], { type: mimeType });
  return URL.createObjectURL(blob);
}