import "./App.css";
import { useMemo, useState } from "react";
import {
  XmtpClient,
  ModelIds,
  ModelType,
  DecodedMessage,
  ListMessagesOptions,
} from "@dataverse/xmtp-client-toolkit";
import {
  Extension,
  RESOURCE,
  RuntimeConnector,
  WALLET,
} from "@dataverse/runtime-connector";
import { Client } from "@xmtp/xmtp-js";

const runtimeConnector = new RuntimeConnector(Extension);

function App() {
  const msgReceiver = useMemo(() => {
    return "0xD0167B1cc6CAb1e4e7C6f38d09EA35171d00b68e";
  }, []);
  const xmtpClient = useMemo(() => {
    return new XmtpClient({
      runtimeConnector,
      appName: import.meta.env.VITE_APP_NAME,
      modelIds: {
        [ModelType.MESSAGE]: import.meta.env.VITE_MESSAGE_MODEL_ID,
        [ModelType.KEYS_CACHE]: import.meta.env.VITE_KEY_CACHE_MODEL_ID,
      } as ModelIds,
      env: "production",
    });
  }, []);
  const [address, setAddress] = useState("");
  const [pkh, setPkh] = useState("");
  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState(false);

  const connectWallet = async () => {
    try {
      const { address } = await xmtpClient.runtimeConnector.connectWallet(
        WALLET.METAMASK
      );
      setAddress(address);
    } catch (error) {
      console.error(error);
    }
  };

  const createCapability = async () => {
    const app = import.meta.env.VITE_APP_NAME;
    console.log("app: ", app);
    const pkh = await xmtpClient.runtimeConnector.createCapability({
      app,
      resource: RESOURCE.CERAMIC,
      wallet: WALLET.METAMASK,
    });
    setPkh(pkh);
    console.log(pkh);
    return pkh;
  };

  const checkCapability = async () => {
    const isCurrentPkhValid =
      await xmtpClient.runtimeConnector.checkCapability();
    console.log(isCurrentPkhValid);
    setIsCurrentPkhValid(isCurrentPkhValid);
  };

  const isMsgReceiverOnNetowork = async () => {
    const isOnNetwork = await xmtpClient.isUserOnNetwork(
      msgReceiver,
      "production"
    );
    console.log("[isMsgReceiverOnNetowork]:", isOnNetwork);
  };

  const getAllConversations = async () => {
    const allConversations = await xmtpClient.getAllConversations();
    console.log("[getAllConversations]res:", allConversations);
  };

  const sendMessageToMsgReceiver = async () => {
    const res = await xmtpClient.sendMessageTo({
      user: msgReceiver,
      msg: "Hello! Nice to meet you.",
    });
    console.log("[sendMessageToMsgReceiver]res:", res);
  };

  const getMessageWithMsgReceiver = async () => {
    const user = {
      user: msgReceiver,
      opts: {
        endTime: new Date(),
      } as ListMessagesOptions,
    };
    const msgList = await xmtpClient.getMessageWithUser(user);
    console.log("[getMessageWithMsgReceiver]res:", msgList);
  };

  const getPaginatedMessageWithMsgReceiver = async () => {
    const pages = (await xmtpClient.getMessageWithUser({
      user: msgReceiver,
      paginatedOptions: { pageSize: 5 },
    })) as any;
    let index = 0;
    console.log("[getPaginatedMessageWithMsgReceiver]res:");
    for await (const page of pages) {
      let tempArr = [];
      for (const msg of page) {
        tempArr.push(msg);
      }
      console.log(`page${index}:`, tempArr);
      ++index;
    }
  };

  const listenConversationsFromStranger = async () => {
    console.log("[listenConversationsFromStranger]: start to listen...");
    const stream = await xmtpClient.getConversationStream();
    for await (const conversation of stream) {
      console.log(`New conversation started with ${conversation.peerAddress}`);
      // Say hello to your new friend
      await conversation.send("Hi there!");
      // Break from the loop to stop listening
      // break;
    }
  };

  const listenNewMsgInConversation = async () => {
    console.log("[listenNewMsgInConversation]: start to listen...");
    const msgStream = await xmtpClient.getMessageStream(msgReceiver);
    for await (const message of msgStream) {
      if (message.senderAddress === (xmtpClient.xmtp as Client).address) {
        continue;
      }
      console.log("[listenNewMsgInConversation]: New message:", message);
    }
  };

  const listenNewMsgInAllConversation = async () => {
    console.log("[listenNewMsgInAllConversation]: start to listen...");
    const stream = await xmtpClient.getMessageStream();
    for await (const message of stream) {
      if (message.senderAddress === (xmtpClient.xmtp as Client).address) {
        continue;
      }
      console.log("[listenNewMsgInAllConversation]: New message:", message);
      const res = await createMsgStream(message);
      console.log(
        "[listenNewMsgInAllConversation]: stream created, res:",
        res
      );
    }
  };

  const createMsgStream = async (message: DecodedMessage) => {
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

    const res = await xmtpClient.runtimeConnector.createStream({
      modelId: import.meta.env.VITE_MESSAGE_MODEL_ID,
      streamContent: streamContent,
    });

    return res;
  };

  const getPersistedMessages = async () => {
    const res = await xmtpClient.getPersistedMessages();
    console.log("[getPersistedMessages]res:", res);
  };

  return (
    <div className="App">
      <button onClick={connectWallet}>connectWallet</button>
      <div className="blackText">{address}</div>
      <hr />
      <button onClick={createCapability}>createCapability</button>
      <div className="blackText">{pkh}</div>
      <hr />
      <button onClick={checkCapability}>checkCapability</button>
      <div className="blackText">
        {isCurrentPkhValid !== undefined && String(isCurrentPkhValid)}
      </div>
      <hr />
      <button onClick={isMsgReceiverOnNetowork}>isMsgReceiverOnNetowork</button>
      <hr />
      <button onClick={getAllConversations}>getAllConversations</button>
      <hr />
      <button onClick={sendMessageToMsgReceiver}>
        sendMessageToMsgReceiver
      </button>
      <hr />
      <button onClick={getMessageWithMsgReceiver}>
        getMessageWithMsgReceiver
      </button>
      <hr />
      <button onClick={getPaginatedMessageWithMsgReceiver}>
        getPaginatedMessageWithMsgReceiver
      </button>
      <hr />
      <button onClick={listenConversationsFromStranger}>
        listenConversationsFromStranger
      </button>
      <hr />
      <button onClick={listenNewMsgInConversation}>
        listenNewMsgInConversation
      </button>
      <hr />
      <button onClick={listenNewMsgInAllConversation}>
        listenNewMsgInAllConversation
      </button>
      <hr />
      <button onClick={getPersistedMessages}>getPersistedMessages</button>
      <hr />
    </div>
  );
}

export default App;
