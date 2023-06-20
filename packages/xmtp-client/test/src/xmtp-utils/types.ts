import {ApiUrls} from "@xmtp/xmtp-js/dist/types/src/ApiClient";

export type XmtpEnv = keyof typeof ApiUrls;

export enum ModelType {
  MESSAGE = "message",
  KEYS_CACHE = "keys_cache",
}

export type ModelIds = Record<ModelType, string>;
