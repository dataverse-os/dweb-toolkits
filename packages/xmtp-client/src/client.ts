import { RuntimeConnector, StreamContent } from "@dataverse/runtime-connector";
import { RuntimeConnectorSigner, StreamHelper } from "@dataverse/utils-toolkit";
import { ModelIds, XmtpEnv } from "./types";
import {
  Client,
  ContentCodec,
  DecodedMessage,
  SendOptions,
} from "@xmtp/xmtp-js";
import {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
} from "@xmtp/xmtp-js/dist/types/src/Client";
import { stringToUint8Array, uint8ArrayToString } from "./utils";
import {
  Attachment,
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";

export class XmtpClient {
  public appName: string;
  public runtimeConnector: RuntimeConnector;
  public signer: RuntimeConnectorSigner;
  public modelIds: ModelIds;
  public env: XmtpEnv;
  public xmtp?: Client;
  public codecs: ContentCodec<Object>[];

  constructor({
    runtimeConnector,
    appName,
    modelIds,
    env,
  }: {
    runtimeConnector: RuntimeConnector;
    appName: string;
    modelIds: ModelIds;
    env: XmtpEnv;
  }) {
    this.runtimeConnector = runtimeConnector;
    this.appName = appName;
    this.modelIds = modelIds;
    this.env = env;
    this.signer = new RuntimeConnectorSigner(this.runtimeConnector);
    this.codecs = [new AttachmentCodec(), new RemoteAttachmentCodec()];
  }

  public async sendMessageTo({ user, msg }: { user: string; msg: string }) {
    if (!(await this.isUserOnNetwork(user, this.env))) {
      throw new Error(`${user} is not on network`);
    }

    const xmtp = await this._lazyInitClient();
    const conversation = await xmtp.conversations.newConversation(user);
    const decodedMsg = await conversation.send(msg);
    await this._persistMessage(decodedMsg);
    return decodedMsg;
  }

  public async sendAttachmentTo({
    user,
    content,
    options,
  }: {
    user: string;
    content: any;
    options?: SendOptions;
  }) {
    if (!(await this.isUserOnNetwork(user, this.env))) {
      throw new Error(`${user} is not on network`);
    }

    const xmtp = await this._lazyInitClient();
    const conversation = await xmtp.conversations.newConversation(user);
    const decodedMsg = await conversation.send(content, options);
    await this._persistMessage(decodedMsg);
    return decodedMsg;
  }

  public async encodeAttachment(attachment: Attachment) {
    return RemoteAttachmentCodec.encodeEncrypted(
      attachment,
      new AttachmentCodec()
    );
  }

  public async decodeAttachment(decodedMsg: DecodedMessage) {
    const attachmentFromRemote: Attachment = await RemoteAttachmentCodec.load(
      decodedMsg.content,
      this.xmtp!
    );
    return attachmentFromRemote;
  }

  public async getAllConversations() {
    const xmtp = await this._lazyInitClient();
    return xmtp.conversations.list();
  }

  public async getMessageWithUser({
    user,
    options,
    paginatedOptions,
  }: {
    user: string;
    options?: ListMessagesOptions;
    paginatedOptions?: ListMessagesPaginatedOptions;
  }) {
    if (!(await this.isUserOnNetwork(user, this.env))) {
      throw new Error(`${user} is not on network`);
    }

    const xmtp = await this._lazyInitClient();
    const conversation = await xmtp.conversations.newConversation(user);

    if (paginatedOptions) {
      return conversation.messagesPaginated(paginatedOptions);
    } else {
      if (!options) {
        options = {
          endTime: new Date(),
        } as ListMessagesOptions;
      }
      const msgList = await conversation.messages(options);
      await this._persistMessages(msgList);
      return msgList;
    }
  }

  async getPersistedMessages() {
    const pkh = await this.runtimeConnector.wallet.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelIds.message,
      pkh: pkh,
    });
    const messages = [];
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        messages.push(streams[key].streamContent.content);
      }
    }
    return messages;
  }

  async getConversationStream() {
    const xmtp = await this._lazyInitClient();
    return xmtp.conversations.stream();
  }

  async getMessageStream(user?: string) {
    const xmtp = await this._lazyInitClient();
    if (user) {
      if (!(await this.isUserOnNetwork(user, this.env))) {
        throw new Error(`${user} is not on network`);
      }

      const targetConversation = await xmtp.conversations.newConversation(user);
      return targetConversation.streamMessages();
    } else {
      return xmtp.conversations.streamAllMessages();
    }
  }

  async isUserOnNetwork(address: string, network: XmtpEnv) {
    return Client.canMessage(address, { env: network });
  }

  private async _lazyInitClient() {
    if (!this.xmtp) {
      const keys = await this._getKeys();
      this.xmtp = await Client.create(null, {
        env: this.env,
        privateKeyOverride: keys,
        codecs: this.codecs,
      });
      return this.xmtp as Client;
    }
    return this.xmtp as Client;
  }

  private async _getKeys() {
    const { exist, value } = await this._checkCache(this.modelIds.keys_cache);
    if (exist) {
      const keys = await this._unlockKeys(value);
      return stringToUint8Array(keys);
    }
    const keys = await Client.getKeys(this.signer, { env: this.env });
    await this._persistKeys(keys);
    return keys;
  }

  private async _unlockKeys(value: any) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const indexFileId = value[key].streamContent.file?.indexFileId;
        if (indexFileId) {
          const unlocked = await this.runtimeConnector.unlock({ indexFileId });
          const streamContent = unlocked.streamContent.content as {
            keys: string;
            encrypted: string;
          };
          return streamContent.keys;
        } else {
          return value[key].streamContent.content.keys;
        }
      }
    }
    throw new Error("cannot get pgp key from folder");
  }

  private async _persistMessage(message: DecodedMessage) {
    const encrypted = JSON.stringify({
      content: true,
    });

    const streamContent = {
      sender_address: message.senderAddress,
      recipient_address: message.recipientAddress ?? "",
      content: message.content,
      content_topic: message.contentTopic,
      content_type: JSON.stringify(message.contentType),
      message_id: message.id,
      message_version: message.messageVersion,
      created_at: message.sent,
      encrypted: encrypted,
    };

    await this.runtimeConnector.createStream({
      modelId: this.modelIds.message,
      streamContent: streamContent,
    });
  }

  private async _persistMessages(msgList: DecodedMessage[]) {
    const pkh = await this.runtimeConnector.wallet.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelIds.message,
      pkh: pkh,
    });

    msgList.map(async (msg) => {
      const fileFilter = (streamContent: StreamContent) => {
        return streamContent.content.message_id == msg.id;
      };
      const unMatchHandler = async () => {
        await this._persistMessage(msg);
      };

      const voidHandler = (_: StreamContent) => {};

      await StreamHelper.traverseStreams(
        streams,
        fileFilter,
        voidHandler,
        unMatchHandler
      );
    });
  }

  private async _persistKeys(keys: Uint8Array) {
    const keysStr = uint8ArrayToString(keys);
    const encrypted = JSON.stringify({
      keys: true,
    });

    const streamContent = {
      keys: keysStr,
      encrypted: encrypted,
    };
    await this.runtimeConnector.createStream({
      modelId: this.modelIds.keys_cache,
      streamContent: streamContent,
    });
  }

  private async _checkCache(modelId: string) {
    const pkh = await this.runtimeConnector.wallet.getCurrentPkh();
    const stream = await this.runtimeConnector.loadStreamsBy({
      modelId: modelId,
      pkh: pkh,
    });
    if (Object.keys(stream).length == 0) {
      return { exist: false, value: null };
    } else {
      return { exist: true, value: stream };
    }
  }
}
