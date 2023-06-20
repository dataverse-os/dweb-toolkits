import {ListMessagesOptions, ListMessagesPaginatedOptions} from "@xmtp/xmtp-js/dist/types/src/Client";
import {Client, DecodedMessage, ApiUrls} from "@xmtp/xmtp-js";

export type XmtpEnv = keyof typeof ApiUrls;

export enum ModelType {
  MESSAGE = "message",
  KEYS_CACHE = "keys_cache",
}

export type ModelIds = Record<ModelType, string>;
export {ListMessagesOptions, ListMessagesPaginatedOptions, Client, DecodedMessage }