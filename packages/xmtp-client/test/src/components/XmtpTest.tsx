import {useState} from 'react'
import {XmtpClient, ModelIds, ModelType, DecodedMessage, ListMessagesOptions} from "@dataverse/xmtp-client-toolkit";
import {Extension, RESOURCE, RuntimeConnector, WALLET} from "@dataverse/runtime-connector";
import { MsgRecipient,} from "../xmtp-utils/constants";
import {Client} from "@xmtp/xmtp-js";

const runtimeConnector = new RuntimeConnector(Extension);
const app = import.meta.env.VITE_APP_NAME;
const modelIds = {
  [ModelType.MESSAGE]: import.meta.env.VITE_MESSAGE_MODEL_ID,
  [ModelType.KEYS_CACHE]: import.meta.env.VITE_KEY_CACHE_MODEL_ID,
} as ModelIds;

const xmtp = new XmtpClient({
  runtimeConnect: runtimeConnector,
  appName: app,
  modelIds: modelIds,
  env: "production",
})

function XmtpTest() {
  // @ts-ignore
  const [wallet, setWallet] = useState("")
  const [address, setAddress] = useState("")
  const [pkh, setPkh] = useState("")
  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState(false)

  const connectWallet = async () => {
    try {
      const res = await runtimeConnector.connectWallet(WALLET.METAMASK);
      setWallet(res.wallet);
      setAddress(res.address);
      return address;
    } catch (error) {
      console.error(error);
    }
  };

  const createCapability = async () => {
    console.log("app: ", app);
    const pkh = await runtimeConnector.createCapability({
      app,
      resource: RESOURCE.CERAMIC,
      wallet: WALLET.METAMASK,
    });
    setPkh(pkh);
    console.log(pkh);
    return pkh;
  };

  const checkCapability = async () => {
    const isCurrentPkhValid = await runtimeConnector.checkCapability();
    console.log(isCurrentPkhValid);
    setIsCurrentPkhValid(isCurrentPkhValid);
  };

  const canMessage = async () => {
    const isOnNetwork = await xmtp.isOnNetwork("0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a", "production")
    console.log("isOnProdNetwork: ", isOnNetwork);
  }

  const allConversations = async () => {
    const allConversations = await xmtp.allConversations();
    console.log("allConversations: ", allConversations);
    for (const conversation of allConversations) {
      console.log(`Saying GM to ${conversation.peerAddress}`);
      await conversation.send("gm");
    }
  }

  const sendMessage = async () => {
    const msg = {
      user: "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a",
      msg: "hello, lady"
    }
    console.log("msg: ", msg)
    const res = await xmtp.sendMessageTo(
      msg
    )
    console.log("res : ", res);
  }

  const listTargetConversation = async () => {
    const user = {
      user: MsgRecipient,
      opts: {
        endTime: new Date()
      } as ListMessagesOptions
    }
    const msgList = await xmtp.getMessageWith(user)
    console.log("messagesInConversation: ", msgList);
  }

  const listMessageWithPaginated = async () => {
    const user = {
      user: MsgRecipient,
      opts: {pageSize: 50}
    }
    const pages = await xmtp.getMessageWithPaginated(user)
    console.log("pages: ", pages);
    for await (const page of pages) {
      for (const msg of page) {
        // Breaking from the outer loop will stop the client from requesting any further pages
        console.log(msg.content);
      }
    }
  }

  const listenForNewConversations = async () => {
    const stream = await xmtp.getConversationStream();
    for await (const conversation of stream) {
      console.log(`New conversation started with ${conversation.peerAddress}`);
      // Say hello to your new friend
      await conversation.send("Hi there!");
      // Break from the loop to stop listening
      // break;
    }
  }

  const listenForNewMsgInConversation = async () => {
    const msgStream = await xmtp.getMessageStreamWith(MsgRecipient);
    for await (const message of msgStream) {
      if (message.senderAddress === (xmtp.xmtp as Client).address) {
        // This message was sent from me
        continue;
      }
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
    }
  }

  const listenForNewMsgInAllConversation = async () => {
    const stream = await xmtp.getMessageStreamOfAllConversation();
    for await (const message of stream) {
      if (message.senderAddress === (xmtp.xmtp as Client).address) {
        // This message was sent from me
        continue;
      }
      console.log("msg: ", message);
      await createMsgStream(message);
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
    }
  }

  const createMsgStream = async (message: DecodedMessage) => {
    const date = new Date().toISOString();
    const encrypted = JSON.stringify({
      content: true,
    });
    console.log("data: ", date);
    console.log("data from msg: ", message.sent);

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
    }

    const res = await runtimeConnector.createStream({
      modelId: modelIds.message,
      streamContent: streamContent,
    });

    console.log("create stream return : ", res);
  };

  const listMessages = async () => {
    const msgArray = await xmtp.listMessages();
    console.log("msgArray: ", msgArray);
  }


  return (
    <>
      <div>
        <button onClick={connectWallet}>connectWallet</button>
        <div className="blackText">{address}</div>
        <hr/>
        <button onClick={createCapability}>createCapability</button>
        <div className="blackText">{pkh}</div>
        <hr/>
        <button onClick={checkCapability}>checkCapability</button>
        <div className="blackText">
          {isCurrentPkhValid !== undefined && String(isCurrentPkhValid)}
        </div>
        <hr/>
        <button onClick={allConversations}>allConversations</button>
        <hr/>
        <button onClick={canMessage}>canMessage</button>
        <hr/>
        <button onClick={sendMessage}>sendMessage</button>
        <hr/>
        <button onClick={listTargetConversation}>listTargetConversation</button>
        <hr/>
        <button onClick={listMessageWithPaginated}>listMessageWithPaginated</button>
        <hr/>
        <button onClick={listenForNewConversations}>listenForNewConversations</button>
        <hr/>
        <button onClick={listenForNewMsgInConversation}>listenForNewMsgInConversation</button>
        <hr/>
        <button onClick={listenForNewMsgInAllConversation}>listenForNewMsgInAllConversation</button>
        <hr/>
        <button onClick={listMessages}>listMessages</button>
        <hr/>
      </div>
    </>
  )
}

export default XmtpTest
