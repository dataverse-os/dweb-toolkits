import {useState} from 'react'
import {Extension, RESOURCE, RuntimeConnector, WALLET} from "@dataverse/runtime-connector";
import {RuntimeConnectorSigner} from "@dataverse/utils-toolkit";
import {Client as XClient} from "@xmtp/xmtp-js"
import {XmtpClient} from "../xmtp-utils/xmtp-client";
import {APP_NAME, KEY_CACHE_MODEL_ID, MESSAGE_MODEL_ID, MsgRecipient,} from "../xmtp-utils/constants";
import {ListMessagesOptions} from "@xmtp/xmtp-js/dist/types/src/Client";
import {DecodedMessage} from "@xmtp/xmtp-js/dist/types/src/Message";
import {ModelIds, ModelType} from "../xmtp-utils/types";

const runtimeConnector = new RuntimeConnector(Extension);
const signer = new RuntimeConnectorSigner(runtimeConnector);
const app = APP_NAME;
// const modelId = MESSAGE_MODEL_ID;
const modelIds = {
  [ModelType.MESSAGE]: MESSAGE_MODEL_ID,
  [ModelType.KEYS_CACHE]: KEY_CACHE_MODEL_ID,
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

  const getXmtpClient = async () => {
    const keys = await XClient.getKeys(signer, {env: "production"});
    return XClient.create(null, {
      env: "production",
      privateKeyOverride: keys,
    });
  }
  const canMessage = async () => {
    const isOnNetwork = await xmtp.isOnNetwork("0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a", "production")
    console.log("isOnProdNetwork: ", isOnNetwork);
  }


  // const newConversation = async () => {
  //   const xmtp = await getXmtpClient();
  //   const conversations = xmtp.conversations;
  //   console.log("conversations: ", conversations);
  // }

  const allConversations = async () => {
    const allConversations = await xmtp.allConversations();
    console.log("allConversations: ", allConversations);
    for (const conversation of allConversations) {
      console.log(`Saying GM to ${conversation.peerAddress}`);
      await conversation.send("gm");
    }
  }
  const createClientWithNoCache = async () => {
    await XClient.create(signer, {
      // persistConversations: false,
    });
  }

  const sendMessage = async () => {
    const msg = {
      to: "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a",
      msg: "hello, lady"
    }
    console.log("msg: ", msg)
    const res = await xmtp.sendMessageTo(
     msg
    )
    console.log("res : ", res);
  }

  const listMessages = async () => {
    const xmtp = await getXmtpClient();
    for (const conversation of await xmtp.conversations.list()) {
      // All parameters are optional and can be omitted
      const opts = {
        // Only show messages from last 24 hours        startTime: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTime: new Date(),
      };
      const messagesInConversation = await conversation.messages(opts);
      console.log("messagesInConversation: ", messagesInConversation);
    }
  }

  const listTargetConversation = async() => {
    const user = {
      to: MsgRecipient,
      opt: {
        endTime: new Date()
      } as ListMessagesOptions
    }
    // @ts-ignore
    const msgs = await xmtp.getMessageWith(user)
    console.log("messagesInConversation: ", msgs);
  }

  const listMessageWithPaginated = async () => {
    const user = {
      to: MsgRecipient,
    opts:{ pageSize: 50}
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
      if (message.senderAddress === xmtp.xmtp.address) {
        // This message was sent from me
        continue;
      }
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
    }
  }

  const listenForNewMsgInAllConversation = async () => {
    const stream = await xmtp.getMessageStreamOfAllConversation();
    for await (const message of stream) {
      if (message.senderAddress === xmtp.xmtp.address) {
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
      recipient_address: message.recipienAddress?? "",
      content: message.content,
      content_topic: message.contentTopic,
      content_type: JSON.stringify(message.contentType),
      message_id: message.id,
      message_version: message.messageVersion,
      created_at: message.send,
      encrypted: encrypted,
    }

    const res = await runtimeConnector.createStream({
      modelId: modelIds.message,
      streamContent: streamContent,
    });

    console.log("create stream return : ", res);
  };


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
{/*        <button onClick={newConversation}>newConversation</button>
        <hr/>
        <button onClick={startNewConversation}>startNewConversation</button>
        <hr/>*/}
        <button onClick={createClientWithNoCache}>createClientWithNoCache</button>
        <hr/>
        <button onClick={sendMessage}>sendMessage</button>
        <hr/>
        <button onClick={listMessages}>listMessages</button>
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
        {/*        <button onClick={sendMessageWithAttachment}>sendMessageWithAttachment</button>
        <hr/>*/}
      </div>
    </>
  )
}

export default XmtpTest
