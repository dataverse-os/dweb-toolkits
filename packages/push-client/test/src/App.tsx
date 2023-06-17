import { WALLET } from "@dataverse/runtime-connector";
import React, { useContext, useMemo, useState } from "react";
import { Context } from "./main";
import "./App.scss";
import {
  getICAPAddress,
  ModelType,
  PushChatClient,
  PushNotificationClient,
} from "@dataverse/push-client-toolkit";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";

const modelIds = {
  [ModelType.MESSAGE]: import.meta.env.VITE_CHAT_MESSAGE_MODEL_ID,
  [ModelType.USER_PGP_KEY]: import.meta.env.VITE_CHAT_PGP_KEY_MODEL_ID,
  [ModelType.CHANNEL]: import.meta.env.VITE_CHANNEL_MODEL_ID,
  [ModelType.NOTIFICATION]: import.meta.env.VITE_NOTIFICATION_MODEL_ID,
};

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const pushNotificationClient = useMemo(() => {
    return new PushNotificationClient({
      runtimeConnector,
      modelIds: modelIds,
      appName: import.meta.env.VITE_APP_NAME,
      env: ENV.STAGING,
    });
  }, []);
  const pushChatClient = useMemo(() => {
    return new PushChatClient({
      runtimeConnector,
      modelIds: modelIds,
      appName: import.meta.env.VITE_APP_NAME,
      env: ENV.STAGING,
    });
  }, []);
  const [account, setAccount] = useState<string>();
  const [did, setDid] = useState<string>();
  // push notification
  const [title, setTitle] = useState<string>();
  const [body, setBody] = useState<string>();
  const [img, setImg] = useState<string>();
  const [cta, setCTA] = useState<string>();

  const [subscribeChannel, setSubscribeChannel] = useState<string>();
  const [queryChannel, setQueryChannel] = useState<string>();
  const [sendChannel, setSendChannel] = useState<string>();
  const [detailChannel, setDetailChannel] = useState<string>();
  const [page, setPage] = useState<string>();
  const [limit, setLimit] = useState<string>();
  const [searchName, setSearchName] = useState<string>();
  // push chat
  const [pushChatUser, setPushChatUser] = useState<string>();
  const [chatMessage, setChatMessage] = useState<string>();
  const [msgReceiver, setMsgReceiver] = useState<string>();
  const [chatRequestSender, setChatRequestSender] = useState<string>();
  const [chatter, setChatter] = useState<string>();
  const [chatterForHistory, setChatterForHistory] = useState<string>();

  const connectIdentity = async () => {
    const { address, wallet } = await runtimeConnector.connectWallet(
      WALLET.METAMASK
    );
    setAccount(address);
    console.log("address:", address);

    const did = await runtimeConnector.createCapability({
      app: import.meta.env.VITE_APP_NAME,
      wallet,
    });
    setDid(did);
    console.log("did:", did);
  };

  const getUserSubscriptions = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    const subscriptions = await pushNotificationClient.getSubscriptionsByUser(
      account
    );
    console.log("[getUserSubscriptions]subscriptions:", subscriptions);
  };

  const getUserSpamNotifications = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    const spams = await pushNotificationClient.getUserSpamNotifications(
      getICAPAddress(account)
    );
    console.log("[getUserSpamNotifications]notifications:", spams);
  };

  const getNotificationsByUser = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    const notifications = await pushNotificationClient.getNotificationsByUser(
      getICAPAddress(account),
      1,
      100
    );
    console.log("[getNotificationsByUser]notifications:", notifications);
  };

  const subscribe = async () => {
    if (!subscribeChannel) {
      console.error("subscribeChannel undefined");
      return;
    }
    try {
      await pushNotificationClient.subscribeChannel(subscribeChannel);
      console.log("[subscribe]done");
    } catch (error) {
      console.error(error);
    }
  };

  const unsubscribe = async () => {
    if (!subscribeChannel) {
      console.error("subscribeChannel undefined");
      return;
    }
    try {
      await pushNotificationClient.unsubscribeChannel(subscribeChannel);
      console.log("[unsubscribe]done");
    } catch (error) {
      console.error(error);
    }
  };

  const sendNotification = async () => {
    if (!sendChannel || !title || !body) {
      console.error("state undefined");
      return;
    }
    const res = await pushNotificationClient.sendNotification(
      sendChannel,
      title,
      body,
      img,
      cta
    );
    console.log("[sendNotification]res:", res);
  };

  const getChannelDetail = async () => {
    if (!detailChannel) {
      console.error("detailChannel undefined");
      return;
    }
    const channelData = await pushNotificationClient.getChannelDetail(
      detailChannel
    );
    console.log("[getChannelDetail]channelData:", channelData);
  };

  const getSubscriberOfChannel = async () => {
    if (!queryChannel || !page || !limit) {
      console.error("state undefined");
      return;
    }
    const subscribers = await pushNotificationClient.getSubscriberOfChannel(
      queryChannel,
      Number(page),
      Number(limit)
    );
    console.log("[getSubscriberOfChannel]subscribers:", subscribers);
  };

  const searchChannelByName = async () => {
    if (!searchName) {
      console.error("searchName undefined");
      return;
    }
    const channelsData = await pushNotificationClient.searchChannelByName(
      searchName,
      1,
      10
    );
    console.log("[searchChannelByName]channelsData:", channelsData);
  };

  /* push chat */
  const createPushChatUser = async () => {
    if (!did) {
      console.error("did undefined");
      return;
    }
    const user = await pushChatClient.createPushChatUser();
    console.log("[createPushChatUser]user:", user);
  };

  const getPushChatUser = async () => {
    if (!pushChatUser) {
      console.error("pushChatUser undefined");
      return;
    }
    const user = await pushChatClient.getPushChatUser(pushChatUser);
    console.log("[getPushChatUser]user:", user);
    return user;
  };

  const decryptPushGPGKey = async () => {
    const res = await pushChatClient.decryptPushGPGKey();
    console.log("[decryptPushGPGKey]res:", res);
  };

  const approveChatRequest = async () => {
    if (!msgReceiver) {
      console.error("msgReceiver undefined");
      return;
    }
    const res = await pushChatClient.approveChatRequest(msgReceiver);
    console.log("[approveChatRequest]res: ", res);
  };

  const sendChatMessage = async () => {
    if (!chatMessage || !msgReceiver) {
      console.error("state undefined");
      return;
    }

    const res = await pushChatClient.sendChatMessage(
      msgReceiver,
      chatMessage,
      "Text"
    );
    console.log("[sendChatMessage]res:", res);
  };

  const fetchUserChats = async () => {
    const chats = await pushChatClient.fetchUserChats();
    console.log("[fetchUserChats]chats:", chats);
  };

  const fetchChatRequest = async () => {
    const res = await pushChatClient.fetchChatRequest();
    console.log("[fetchChatRequest]res:", res);
  };

  const getLatestChats = async () => {
    if (!chatter) {
      console.error("undefined chatter");
      return;
    }
    const chats = await pushChatClient.fetchLatestChats(chatter);
    console.log("[getLatestChats]chats:", chats);
  };

  const getHistoryChats = async () => {
    if (!chatterForHistory) {
      console.error("undefined chatterForHistory");
      return;
    }
    console.log("import.meta.env.VITE_CHAT_MESSAGE_MODEL_ID:", import.meta.env.VITE_CHAT_MESSAGE_MODEL_ID)
    const res = await pushChatClient.fetchHistoryChats(chatterForHistory, 20);
    console.log("[getHistoryChats]res:", res);
  };

  const getNotifications = async () => {
    const noticeList = await pushNotificationClient.getNotificationList();
    console.log("noticeList: ", noticeList);
  };

  const getMessageList = async () => {
    const msgList = await pushChatClient.getMessageList();
    console.log("msgList: ", msgList);
  };

  return (
    <div id="App">
      <div className="app-header">
        <div className="account-did">
          <div className="account border-shape">
            {`account: ${account || ""}`}
          </div>
          <div className="did border-shape">{`did: ${did || ""}`}</div>
        </div>
        <div className="connect-identity">
          <button onClick={connectIdentity}>Connect Identity</button>
        </div>
      </div>

      <div className="app-body">
        <h1>Push Notification</h1>

        <div className="item">
          <button
            className="block"
            disabled={account ? false : true}
            onClick={getUserSubscriptions}
          >
            getUserSubscriptions
          </button>
        </div>
        <div className="item">
          <button
            className="block"
            disabled={account ? false : true}
            onClick={getUserSpamNotifications}
          >
            getUserSpamNotifications
          </button>
        </div>
        <div className="item">
          <button
            className="block"
            disabled={account ? false : true}
            onClick={getNotificationsByUser}
          >
            getNotificationsByUser
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={subscribeChannel || ""}
            placeholder={
              "Channel: eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"
            }
            onChange={(event) => setSubscribeChannel(event.target.value)}
          />
          <button
            disabled={did && subscribeChannel ? false : true}
            className="block"
            onClick={subscribe}
          >
            subscribe
          </button>
          <button
            disabled={did && subscribeChannel ? false : true}
            className="block"
            onClick={unsubscribe}
          >
            unsubscribe
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={sendChannel || ""}
            placeholder={
              "Channel: eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"
            }
            onChange={(event) => setSendChannel(event.target.value)}
          />
          <input
            type="text"
            value={title || ""}
            placeholder={"notification title"}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            type="text"
            value={body || ""}
            placeholder={"notification body"}
            onChange={(event) => setBody(event.target.value)}
          />
          <input
            type="text"
            value={img || ""}
            placeholder={"notification img"}
            onChange={(event) => setImg(event.target.value)}
          />
          <input
            type="text"
            value={cta || ""}
            placeholder={"notification cta"}
            onChange={(event) => setCTA(event.target.value)}
          />
          <button
            disabled={did && sendChannel && title && body ? false : true}
            onClick={sendNotification}
          >
            sendNotification
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={detailChannel || ""}
            placeholder={
              "Channel: eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"
            }
            onChange={(event) => setDetailChannel(event.target.value)}
          />
          <button onClick={getChannelDetail}>getChannelDetail</button>
        </div>
        <div className="item">
          <input
            type="text"
            value={queryChannel || ""}
            placeholder={
              "Chanel: eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"
            }
            onChange={(event) => setQueryChannel(event.target.value)}
          />
          <input
            type="text"
            value={page || ""}
            placeholder={"page number"}
            onChange={(event) => setPage(event.target.value)}
          />
          <input
            type="text"
            value={limit || ""}
            placeholder={"limit number"}
            onChange={(event) => setLimit(event.target.value)}
          />
          <button onClick={getSubscriberOfChannel}>
            getSubscriberOfChannel
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={searchName || ""}
            placeholder={"Channel Name"}
            onChange={(event) => setSearchName(event.target.value)}
          />
          <button
            disabled={searchName ? false : true}
            onClick={searchChannelByName}
          >
            searchChannelByName
          </button>
        </div>
        <div className="item">
          <button
            disabled={account ? false : true}
            onClick={getUserSpamNotifications}
          >
            getUserSpamNotifications
          </button>
        </div>

        <h1>Push Chat</h1>
        <div className="item">
          <button disabled={did ? false : true} onClick={createPushChatUser}>
            createPushChatUser
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={pushChatUser || ""}
            placeholder={
              "pushChatUser: 0x13a6D1fe418de7e5B03Fb4a15352DfeA3249eAA4"
            }
            onChange={(event) => setPushChatUser(event.target.value)}
          />
          <button
            disabled={pushChatUser ? false : true}
            onClick={getPushChatUser}
          >
            getPushChatUser
          </button>
        </div>
        <div className="item">
          <button onClick={decryptPushGPGKey}>decryptPushGPGKey</button>
        </div>
        <div className="item">
          <input
            type="text"
            value={chatMessage || ""}
            placeholder={"chatMessage"}
            onChange={(event) => setChatMessage(event.target.value)}
          />
          <input
            type="text"
            value={msgReceiver || ""}
            placeholder={"enter receiver here ..."}
            onChange={(event) => setMsgReceiver(event.target.value)}
          />
          <button
            className="block"
            disabled={did && chatMessage && msgReceiver ? false : true}
            onClick={sendChatMessage}
          >
            sendChatMessage
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={chatRequestSender || ""}
            placeholder={"chatRequestSender address"}
            onChange={(event) => setChatRequestSender(event.target.value)}
          />
          <button disabled={did ? false : true} onClick={approveChatRequest}>
            approveChatRequest
          </button>
        </div>
        <div className="item">
          <button disabled={did ? false : true} onClick={fetchUserChats}>
            fetchUserChats
          </button>
        </div>
        <div className="item">
          <button disabled={did ? false : true} onClick={fetchChatRequest}>
            fetchChatRequest
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={chatter || ""}
            placeholder={"address you chat with ..."}
            onChange={(event) => setChatter(event.target.value)}
          />
          <button
            disabled={did && chatter ? false : true}
            onClick={getLatestChats}
          >
            getLatestChats
          </button>
        </div>
        <div className="item">
          <input
            type="text"
            value={chatterForHistory || ""}
            placeholder={"address you chat with ..."}
            onChange={(event) => setChatterForHistory(event.target.value)}
          />
          <button
            disabled={did && chatterForHistory ? false : true}
            onClick={getHistoryChats}
          >
            getHistoryChats
          </button>
          <br />
          <button onClick={getNotifications}>getNotifications</button>
          <br />
          <button onClick={getMessageList}>getMessageList</button>
        </div>
      </div>
    </div>
  );
};

export default App;
