import {
  DataverseConnector,
  SYSTEM_CALL,
  StreamContent,
} from "@dataverse/dataverse-connector";
import * as PushAPI from "@pushprotocol/restapi";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";
import { getICAPAddress } from "./utils";
import { StreamHelper } from "@dataverse/utils-toolkit";
import { ModelIds } from "./types";
import { Checker } from "@dataverse/utils-toolkit";

class PushClientBase {
  public dataverseConnector: DataverseConnector;
  public env: ENV;
  public modelIds: ModelIds;
  protected checker: Checker;

  constructor({
    dataverseConnector,
    modelIds,
    env,
  }: {
    dataverseConnector: DataverseConnector;
    modelIds: ModelIds;
    env: ENV;
  }) {
    this.dataverseConnector = dataverseConnector;
    this.checker = new Checker(dataverseConnector);
    this.env = env;
    this.modelIds = modelIds;
  }
}

export class PushNotificationClient extends PushClientBase {
  constructor({
    dataverseConnector,
    modelIds,
    env,
  }: {
    dataverseConnector: DataverseConnector;
    modelIds: ModelIds;
    env: ENV;
  }) {
    super({
      dataverseConnector,
      modelIds,
      env,
    });
  }

  async sendNotification(
    channel: string,
    title: string,
    body: string,
    img?: string,
    cta?: string
  ) {
    await this.checker.checkCapability();

    await this._checkChannelExist();

    const channelDetail = await this.getChannelDetail(channel);
    const createNotificationStream = async () => {
      const streamContent = this._generateNotificationStreamContent(
        channelDetail,
        title,
        body,
        img,
        cta
      );

      await this.dataverseConnector.runOS({
        method: SYSTEM_CALL.createStream,
        params: {
          modelId: this.modelIds.notification,
          streamContent,
        },
      });
    };

    const createChannelInfoStream = async () => {
      if (await this._isChannelInfoStreamExist()) {
        return;
      }
      const streamContent =
        this._generateChannelInfoStreamContent(channelDetail);
      await this.dataverseConnector.runOS({
        method: SYSTEM_CALL.createStream,
        params: {
          modelId: this.modelIds.channel,
          streamContent,
        },
      });
    };

    await Promise.all([createNotificationStream(), createChannelInfoStream()]);

    return PushAPI.payloads.sendNotification({
      signer: this.dataverseConnector.getProvider(),
      type: 1, // broadcast
      identityType: 2, // direct payload
      notification: {
        title,
        body,
      },
      payload: {
        title,
        body,
        img: img ?? "",
        cta: img ?? "",
      },
      channel, // your channel address
      env: this.env,
    });
  }

  async getNotificationsByUser(channel: string, page: number, limit: number) {
    return PushAPI.user.getFeeds({
      user: channel, // user address in CAIP
      env: this.env,
      page: page,
      limit: limit,
    });
  }

  async searchChannelByName(searchName: string, page: number, limit: number) {
    return PushAPI.channels.search({
      query: searchName, // a search query
      page: page, // page index
      limit: limit, // no of items per page
      env: this.env,
    });
  }

  async getChannelDetail(channel: string) {
    return PushAPI.channels.getChannel({
      channel: channel, // channel address in CAIP
      env: this.env,
    });
  }

  async subscribeChannel(channel: string) {
    await PushAPI.channels.subscribe({
      signer: this.dataverseConnector.getProvider(),
      channelAddress: channel, // channel address in CAIP
      userAddress: getICAPAddress(this.dataverseConnector.address!), // user address in CAIP
      onSuccess: () => {
        console.log("opt in success");
      },
      onError: () => {
        console.error("opt in error");
      },
      env: this.env,
    });
  }

  async unsubscribeChannel(channel: string) {
    this.checker.checkWallet();

    await PushAPI.channels.unsubscribe({
      signer: this.dataverseConnector.getProvider(),
      channelAddress: channel, // channel address in CAIP
      userAddress: getICAPAddress(this.dataverseConnector.address!), // user address in CAIP
      onSuccess: () => {
        console.log("opt out success");
      },
      onError: () => {
        console.error("opt out error");
      },
      env: this.env,
    });
  }

  async getSubscriptionsByUser(userAddress: string) {
    return PushAPI.user.getSubscriptions({
      user: getICAPAddress(userAddress), // user address in CAIP
      env: this.env,
    });
  }

  async getUserSpamNotifications(user: string) {
    return PushAPI.user.getFeeds({
      user: user, // user address in CAIP
      spam: true,
      env: this.env,
    });
  }

  async getSubscriberOfChannel(channel: string, page: number, limit: number) {
    return await PushAPI.channels.getSubscribers({
      channel: channel, // channel address in CAIP
      page: page, // Optional, defaults to 1
      limit: limit, // Optional, defaults to 10
      env: this.env, // Optional, defaults to 'prod'
    });
  }

  async getNotificationList() {
    await this.checker.checkCapability();

    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const notificationStreams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelIds.notification,
        pkh: pkh,
      },
    });
    const notification = [];
    for (const key in notificationStreams) {
      // loop through the RecordType
      if (Object.prototype.hasOwnProperty.call(notificationStreams, key)) {
        notification.push(notificationStreams[key].streamContent.content);
      }
    }
    return notification;
  }

  private _generateNotificationStreamContent = (
    channelDetail: any,
    title: string,
    body: string,
    img = "",
    cta = ""
  ) => {
    return {
      cta,
      channel: channelDetail.channel,
      title,
      message: body,
      icon: channelDetail.icon,
      url: channelDetail.url,
      sid: "",
      app: channelDetail.app,
      image: img,
      blockchain: channelDetail.blockchain,
      notification_body: body,
      notification_title: title,
      secret: "",
      createdAt: new Date().toISOString(),
      // encrypted: encrypted,
    };
  };

  private _generateChannelInfoStreamContent = (channelDetail: any) => {
    return {
      channel_id: channelDetail.id,
      channel: channelDetail.channel,
      ipfshash: channelDetail.ipfshash,
      name: channelDetail.name,
      info: channelDetail.info,
      url: channelDetail.url,
      icon: channelDetail.icon,
      processed: channelDetail.processed,
      attempts: channelDetail.attempts,
      alias_address: channelDetail.alias_address,
      alias_verification_event:
        channelDetail.alias_verification_event == null
          ? ""
          : channelDetail.alias_verification_event,
      is_alias_verified: channelDetail.is_alias_verified,
      alias_blockchain_id: channelDetail.alias_blockchain_id,
      activation_status: channelDetail.activation_status,
      verified_status: channelDetail.verified_status,
      timestamp: channelDetail.timestamp,
      blocked: channelDetail.blocked,
      counter: channelDetail.counter == null ? 0 : channelDetail.counter,
      subgraph_details:
        channelDetail.subgraph_details == null
          ? ""
          : channelDetail.subgraph_details,
      subgraph_attempts: channelDetail.subgraph_attempts,
    };
  };

  private async _checkChannelExist() {
    const address = this.dataverseConnector.address!;
    const detail = await this.getChannelDetail(getICAPAddress(address));
    if (detail == null) {
      throw new Error(`this account does not have channel`);
    }
  }

  private async _isChannelInfoStreamExist() {
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelIds.channel,
        pkh: pkh,
      },
    });

    return Object.keys(streams).length > 0;
  }
}

export class PushChatClient extends PushClientBase {
  constructor({
    dataverseConnector,
    modelIds,
    env,
  }: {
    dataverseConnector: DataverseConnector;
    modelIds: ModelIds;
    env: ENV;
  }) {
    super({
      dataverseConnector,
      modelIds,
      env,
    });
  }

  async getPushChatUser(userAddress: string) {
    return await PushAPI.user.get({
      account: `eip155:${userAddress}`,
      env: this.env,
    });
  }

  async createPushChatUser() {
    this.checker.checkWallet();

    const user = await this.getPushChatUser(
      this.dataverseConnector.address!
    );
    if (!user?.encryptedPrivateKey) {
      return await PushAPI.user.create({
        signer: this.dataverseConnector.getProvider(), // ethers.js signer
        env: this.env,
      });
    }
    return user;
  }

  async decryptPushGPGKey() {
    await this.checker.checkCapability();

    const user = await this.getPushChatUser(
      this.dataverseConnector.address!
    );
    if (!user) {
      throw new Error("user not exist");
    }
    const { exist, value } = await this._checkCache(this.modelIds.user_pgp_key);
    if (exist) {
      return await this._unlockPgpKey(value);
    } else {
      const pgpKey = await PushAPI.chat.decryptPGPKey({
        encryptedPGPPrivateKey: user.encryptedPrivateKey,
        account: user.wallets,
        signer: this.dataverseConnector.getProvider(),
        env: this.env,
      });
      await this._persistPgpKey(pgpKey);
      return pgpKey;
    }
  }

  async sendChatMessage(
    receiver: string,
    messageContent: string,
    messageType: "Text" | "Image" | "File" | "GIF" | "MediaURL"
  ) {
    await this.checker.checkCapability();

    const user = await this.getPushChatUser(
      this.dataverseConnector.address!
    );
    if (!user) {
      throw new Error("user not exist");
    }
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const msg = await PushAPI.chat.send({
      messageContent,
      messageType, // "Text" | "Image" | "File" | "GIF"
      receiverAddress: `eip155:${receiver}`,
      signer: this.dataverseConnector.getProvider(),
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: this.env,
    });
    const streamContent = this._generateChatMessageStreamContent(msg);

    await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.createStream,
      params: {
        modelId: this.modelIds.message,
        streamContent,
      },
    });
    return msg;
  }

  async fetchUserChats() {
    await this.checker.checkCapability();

    const address = this.dataverseConnector.address!;
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const chats = await PushAPI.chat.chats({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: this.env,
      page: 1,
      limit: 10,
    });

    const msgStreamContent = this._generateChatMessageStreamContent(
      chats[0].msg
    );
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelIds.message,
        pkh: pkh,
      },
    });
    const streamFilter = (streamContent: StreamContent) => {
      return streamContent.content.timestamp === msgStreamContent.timestamp;
    };
    const unmatchedHandler = async () => {
      await this.dataverseConnector.runOS({
        method: SYSTEM_CALL.createStream,
        params: {
          modelId: this.modelIds.message,
          streamContent: msgStreamContent,
        },
      });
    };

    await StreamHelper.traverseStreams(
      streams,
      streamFilter,
      () => {},
      unmatchedHandler
    );

    return chats;
  }

  async fetchChatRequest() {
    this.checker.checkWallet();

    const address = this.dataverseConnector.address!;
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const response = await PushAPI.chat.requests({
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: this.env,
    });
    return response;
  }

  async approveChatRequest(senderAddress: string) {
    this.checker.checkWallet();

    const address = this.dataverseConnector.address!;
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const response = await PushAPI.chat.approve({
      senderAddress: senderAddress,
      pgpPrivateKey: pgpDecryptedPvtKey,
      status: "Approved",
      account: `eip155:${address}`,
      env: this.env,
    });
    return response;
  }

  async fetchLatestChats(receiverAddress: string) {
    this.checker.checkWallet();

    const address = this.dataverseConnector.address!;
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const conversationHash = await this.getConversationHash(
      address,
      receiverAddress
    );
    const chatHistory = await PushAPI.chat.latest({
      threadhash: conversationHash.threadHash,
      account: `eip155:${address}`,
      toDecrypt: true,
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: this.env,
    });
    return chatHistory;
  }

  async fetchHistoryChats(receiverAddress: string, limit: number) {
    await this.checker.checkCapability();

    const address = this.dataverseConnector.address!;
    const pgpDecryptedPvtKey = await this.decryptPushGPGKey();
    const conversationHash = await this.getConversationHash(
      address,
      receiverAddress
    );
    const chatHistory = await PushAPI.chat.history({
      threadhash: conversationHash.threadHash,
      account: `eip155:${address}`,
      limit: limit,
      toDecrypt: true,
      pgpPrivateKey: pgpDecryptedPvtKey,
      env: this.env,
    });
    const streamContents =
      this._batchGenerateChatMessageStreamContent(chatHistory);

    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelIds.message,
        pkh: pkh,
      },
    });

    streamContents.map(async (msgStreamContent) => {
      const streamFilter = (streamContent: StreamContent) => {
        return streamContent.content.timestamp === msgStreamContent.timestamp;
      };
      const unmatchedHandler = async () => {
        if (msgStreamContent.link === null) {
          msgStreamContent.link = undefined;
        }
        await this.dataverseConnector.runOS({
          method: SYSTEM_CALL.createStream,
          params: {
            modelId: this.modelIds.message,
            streamContent: msgStreamContent,
          },
        });
      };

      StreamHelper.traverseStreams(
        streams,
        streamFilter,
        () => {},
        unmatchedHandler
      );
    });

    return chatHistory;
  }

  async getConversationHash(address: string, receiverAddress: string) {
    const hash = await PushAPI.chat.conversationHash({
      account: `eip155:${address}`,
      conversationId: `eip155:${receiverAddress}`,
      env: this.env,
    });
    if (hash.threadHash) {
      return hash;
    } else {
      throw new Error("conversation no exist");
    }
  }

  async getMessageList() {
    await this.checker.checkCapability();

    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelIds.message,
        pkh: pkh,
      },
    });
    const messages = [];
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        messages.push(streams[key].streamContent.content);
      }
    }
    return messages;
  }

  private async _checkCache(modelId: string) {
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const stream = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: modelId,
        pkh: pkh,
      },
    });
    if (Object.keys(stream).length == 0) {
      return { exist: false, value: null };
    } else {
      return { exist: true, value: stream };
    }
  }

  private async _unlockPgpKey(value: any) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const indexFileId = value[key].streamContent.file?.indexFileId;
        if (indexFileId) {
          const unlocked = await this.dataverseConnector.runOS({
            method: SYSTEM_CALL.unlock,
            params: {
              indexFileId,
            },
          });
          const pgpContent = unlocked.streamContent.content as {
            pgp_key: string;
            encrypted: string;
          };
          return pgpContent.pgp_key;
        } else {
          return value[key].streamContent.content.pgp_key;
        }
      }
    }
    throw new Error("cannot get pgp key from folder");
  }

  private async _persistPgpKey(pgpKey: string) {
    const encrypted = JSON.stringify({
      pgp_key: true,
    });

    const streamContent = {
      pgp_key: pgpKey,
      encrypted: encrypted,
    };

    await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.createStream,
      params: {
        modelId: this.modelIds.user_pgp_key,
        streamContent,
      },
    });
  }

  private _batchGenerateChatMessageStreamContent(chatMessages: any[]) {
    const contents: StreamContent[] = [];
    chatMessages.forEach((chatMessage: any) => {
      const content = this._generateChatMessageStreamContent(chatMessage);
      contents.push(content as StreamContent);
    });
    return contents as StreamContent[];
  }

  private _generateChatMessageStreamContent(msg: any) {
    const encrypted = JSON.stringify({
      link: true,
      cid: true,
    });

    const from = msg.fromCAIP10.split(":")[1];
    const to = msg.toCAIP10.split(":")[1];

    return {
      from: `did:eip155:${from}`,
      to: `did:eip155:${to}`,
      from_CAIP10: msg.fromCAIP10,
      to_CAIP10: msg.toCAIP10,
      from_DID: msg.fromDID,
      to_DID: msg.toDID,
      message_Content: msg.messageContent,
      message_type: msg.messageType,
      signature: msg.signature,
      timestamp: msg.timestamp,
      sig_type: msg.sigType,
      enc_type: msg.encType,
      encrypted_secret: msg.encryptedSecret,
      link: msg.link,
      cid: msg.cid == null ? "" : msg.cid,
      encrypted: encrypted,
    } as StreamContent;
  }
}
