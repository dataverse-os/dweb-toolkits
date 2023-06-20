import {useState} from 'react'
import {Extension, RESOURCE, RuntimeConnector, WALLET} from "@dataverse/runtime-connector";
import {RuntimeConnectorSigner} from "@dataverse/utils-toolkit";
import {Client as XClient} from "@xmtp/xmtp-js"
import {XmtpClient} from "../xmtp-utils/xmtp-client";

const runtimeConnector = new RuntimeConnector(Extension);
const signer = new RuntimeConnectorSigner(runtimeConnector);
const app = "fxy001"; //fxy001 test001
// const slug = "fxy001";
// const PEER_ADDRESS = "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"

const xmtp = new XmtpClient({
  runtimeConnect: runtimeConnector,
  appName: app,
  // modelIds: ModelIds,
  env: "production",
})
// const app = VITE_APP_NAME; //fxy001 test001
// const slug = VITE_APP_NAME;
function Runtime() {
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
    // await connectWallet();
    // // await switchNetwork();
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


  const allConversations = async () => {
    const allConversations = await xmtp.allConversations();
    console.log("allConversations: ", allConversations);
    for (const conversation of allConversations) {
      console.log(`Saying GM to ${conversation.peerAddress}`);
      await conversation.send("gm");
    }
//     const xmtp = await getXmtpClient();
//     const allConversations = await xmtp.conversations.list()
//     console.log("allConversations: ", allConversations);
// // Say gm to everyone you've been chatting with
//     for (const conversation of allConversations) {
//       console.log(`Saying GM to ${conversation.peerAddress}`);
//       await conversation.send("gm");
//     }

  }


  const canMessage = async () => {
    // const xmtp = await getXmtpClient();
    const isOnProdNetwork = await XClient.canMessage(
      "0x3F11b27F323b62B159D2642964fa27C46C841897",
      {env: "production"}
    );
    console.log("isOnProdNetwork: ", isOnProdNetwork);
  }

  const newConversation = async () => {
    const xmtp = await getXmtpClient();
    const conversations = xmtp.conversations;
    console.log("conversations: ", conversations);
  }


  // Function to load the existing messages in a conversation
  // const newConversation = async function (xmtp_client: any , addressTo: any) {
  //   //Creates a new conversation with the address
  //   if (await xmtp_client?.canMessage(PEER_ADDRESS)) {
  //     const conversation = await xmtp_client.conversations.newConversation(
  //       addressTo
  //     );
  //     convRef.current = conversation;
  //     //Loads the messages of the conversation
  //     const messages = await conversation.messages();
  //     setMessages(messages);
  //   } else {
  //     console.log("cant message because is not on the network.");
  //     //cant message because is not on the network.
  //   }
  // };

  // Function to initialize the XMTP client
  // const initXmtp = async function () {
  //   // Create the XMTP client
  //   const xmtp = await Client.create(signer, {env: "production"});
  //   //Create or load conversation with Gm bot
  //   newConversation(xmtp, PEER_ADDRESS);
  //   // Set the XMTP client in state for later use
  //   setIsOnNetwork(!!xmtp.address);
  //   //Set the client in the ref
  //   clientRef.current = xmtp;
  // };

  const startNewConversation = async () => {
    const xmtp = await getXmtpClient();
    const newConversation = await xmtp.conversations.newConversation(
      "0x3F11b27F323b62B159D2642964fa27C46C841897"
    );
    console.log("conversation : ", newConversation)
  }

  const listExistingConversations = async () => {
    const xmtp = await getXmtpClient();
    const allConversations = await xmtp.conversations.list();
// Say gm to everyone you've been chatting with
    for (const conversation of allConversations) {
      console.log(`Saying GM to ${conversation.peerAddress}`);
      await conversation.send("gm");
    }
  }

  const createClientWithNoCache = async () => {
    const clientWithNoCache = await XClient.create(signer, {
      // persistConversations: false,
    });
  }

  const sendMessage = async () => {
    const xmtp = await getXmtpClient();
    const conversation = await xmtp.conversations.newConversation(
      "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"
    );
    const res = await conversation.send("Hello dude");
    console.log("res : ", res);
  }

  const listMessages = async () =>{
    const xmtp = await getXmtpClient();
    for (const conversation of await xmtp.conversations.list()) {
      // All parameters are optional and can be omitted
      const opts = {
        // Only show messages from last 24 hours
        startTime: new Date(new Date().setDate(new Date().getDate() - 1)),
        endTime: new Date(),
      };
      const messagesInConversation = await conversation.messages(opts);
      console.log("messagesInConversation: ", messagesInConversation);
    }
  }

  const listMessageWithPaginated = async () => {
    const xmtp = await getXmtpClient();
    const conversation = await xmtp.conversations.newConversation(
      "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"
    );

    for await (const page of conversation.messagesPaginated({ pageSize: 2 })) {
      for (const msg of page) {
        // Breaking from the outer loop will stop the client from requesting any further pages
        if (msg.content === "gm") {
          return;
        }
        console.log(msg.content);
      }
    }
  }

  const listenForNewConversations = async () => {
    const xmtp = await getXmtpClient();
    const stream = await xmtp.conversations.stream();
    for await (const conversation of stream) {
      console.log(`New conversation started with ${conversation.peerAddress}`);
      // Say hello to your new friend
      await conversation.send("Hi there!");
      // Break from the loop to stop listening
      break;
    }
  }

  const listenForNewMsgInConversation = async () => {
    const xmtp = await getXmtpClient();
    const conversation = await xmtp.conversations.newConversation(
      "0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a"
    );
    for await (const message of await conversation.streamMessages()) {
      if (message.senderAddress === xmtp.address) {
        // This message was sent from me
        continue;
      }
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
    }
  }

  const listenForNewMsgInAllConversation = async () => {
    const xmtp = await getXmtpClient();
    for await (const message of await xmtp.conversations.streamAllMessages()) {
      if (message.senderAddress === xmtp.address) {
        // This message was sent from me
        continue;
      }
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
    }
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
        <button onClick={newConversation}>newConversation</button>
        <hr/>
        <button onClick={startNewConversation}>startNewConversation</button>
        <hr/>
        <button onClick={listExistingConversations}>listExistingConversations</button>
        <hr/>
        <button onClick={createClientWithNoCache}>createClientWithNoCache</button>
        <hr/>
        <button onClick={sendMessage}>sendMessage</button>
        <hr/>
        <button onClick={listMessages}>listMessages</button>
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

export default Runtime
