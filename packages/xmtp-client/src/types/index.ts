import {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
} from "@xmtp/xmtp-js/dist/types/src/Client";
import { DecodedMessage, ApiUrls } from "@xmtp/xmtp-js";

import {
  Attachment,
  AttachmentCodec,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";

export type XmtpEnv = keyof typeof ApiUrls;

export enum ModelType {
  MESSAGE = "message",
  KEYS_CACHE = "keys_cache",
}

export type ModelIds = Record<ModelType, string>;

export {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  DecodedMessage,
  Attachment,
  AttachmentCodec,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
};
