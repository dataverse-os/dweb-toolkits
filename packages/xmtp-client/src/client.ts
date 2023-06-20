import {RuntimeConnector} from "@dataverse/runtime-connector";
import {RuntimeConnectorSigner} from "@dataverse/utils-toolkit";
import {ModelIds, XmtpEnv} from "./types";
import {Client, DecodedMessage} from "@xmtp/xmtp-js";
import {ListMessagesOptions, ListMessagesPaginatedOptions} from "@xmtp/xmtp-js/dist/types/src/Client";

export class XmtpClient {
  public appName: string;
  public runtimeConnector: RuntimeConnector
  public signer: RuntimeConnectorSigner
  public modelIds: ModelIds
  public env: XmtpEnv
  public xmtp: Client | undefined

  constructor({
                runtimeConnect,
                appName,
                modelIds,
                env
              }: {
    runtimeConnect: RuntimeConnector,
    appName: string,
    modelIds: ModelIds,
    env: XmtpEnv,
  }) {
    this.runtimeConnector = runtimeConnect;
    this.appName = appName;
    this.modelIds = modelIds;
    this.env = env;
    this.signer = new RuntimeConnectorSigner(this.runtimeConnector);
  }

  async sendMessageTo({user, msg}: {user: string, msg: string}) {
    const xmtp = await this._lazyInitClient();
    await this.assertUserOnNetwork(user);
    const conversation = await xmtp.conversations.newConversation(user);
    const decodedMsg = await conversation.send(msg);
    await this._persistMessage(decodedMsg);
    return decodedMsg;
  }

  async allConversations(){
    const xmtp = await this._lazyInitClient();
    return xmtp.conversations.list();
  }

  async getMessageWith({user, opts}: {user: string, opts: ListMessagesOptions}) {
    await this.assertUserOnNetwork(user);
    const xmtp = await this._lazyInitClient();
    const conversation = await xmtp.conversations.newConversation(user);
    return conversation.messages(opts);
  }

  async getMessageWithPaginated({user, opts}: {user: string, opts?: ListMessagesPaginatedOptions }) {
    const xmtp = await this._lazyInitClient();
    await this.assertUserOnNetwork(user);
    const conversation = await xmtp.conversations.newConversation(user);
    return conversation.messagesPaginated(opts);
  }

  async listMessages(){
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

  async getMessageStreamWith(user: string) {
    await this.assertUserOnNetwork(user);
    const xmtp = await this._lazyInitClient();
    const conversation = await xmtp.conversations.newConversation(user);
    return conversation.streamMessages();
  }

  async getMessageStreamOfAllConversation() {
    const xmtp = await this._lazyInitClient();
    return xmtp.conversations.streamAllMessages();
  }

  private async getKeys(){
    const {exist, value } = await this._checkCache(this.modelIds.keys_cache);
    if(exist) {
      console.log("hit key cache ......");
      const keys = await this._unlockKeys(value);
      return this.stringToUint8Array(keys);
    }
    const keys = await Client.getKeys(this.signer, {env: this.env});
    await this._persistKeys(keys)
    return keys;
  }

  private async assertUserOnNetwork(to: string) {
    if (!await this.isOnNetwork(to, this.env)) {
      throw new Error(`${to} is not on network`);
    }
  }

  async isOnNetwork(address: string, network: XmtpEnv) {
    return Client.canMessage(address, {env: network})
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

  private async _persistMessage(message: DecodedMessage){
    const encrypted = JSON.stringify({
      content: true,
    });

    const streamContent = {
      sender_address: message.senderAddress,
      recipient_address: message.recipientAddress?? "",
      content: message.content,
      content_topic: message.contentTopic,
      content_type: JSON.stringify(message.contentType),
      message_id: message.id,
      message_version: message.messageVersion,
      created_at: message.sent,
      encrypted: encrypted,
    }

    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds.message,
      streamContent: streamContent,
    });
    console.log("create stream return : ", res);
  }

  private async _persistKeys(keys: Uint8Array) {
    const keysStr = this.uint8ArrayToString(keys);
    const encrypted = JSON.stringify({
      keys: true,
    });

    const streamContent = {
      keys: keysStr,
      encrypted: encrypted
    }
    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds.keys_cache,
      streamContent: streamContent,
    });
    console.log("create key cache : ", res);
  }

  private async _lazyInitClient(){
    if(this.xmtp == undefined) {
      const keys = await this.getKeys();
      this.xmtp = await Client.create(null, {
        env: this.env,
        privateKeyOverride: keys,
      })
      return this.xmtp as Client;
    }
    return this.xmtp as Client;
  }

  private async _checkCache(modelId: string) {
    const pkh = await this.runtimeConnector.wallet.getCurrentPkh();
    console.log("pkh: ", pkh);
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

  uint8ArrayToString = (uint8Array: Uint8Array): string => {
    let charArray = [];
    for (let i = 0; i < uint8Array.length; i++) {
      charArray.push(String.fromCharCode(uint8Array[i]));
    }
    return charArray.join('');
  }

  stringToUint8Array = (str: string): Uint8Array => {
    let uint8Array = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      uint8Array[i] = str.charCodeAt(i);
    }
    return uint8Array;
  }
}
