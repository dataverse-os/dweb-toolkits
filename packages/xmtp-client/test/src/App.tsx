import "./App.css";
import { useMemo, useState } from "react";
import Client, {
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
import { Client as XmtpOfficalClient } from "@xmtp/xmtp-js";
import Upload, {web3Storage} from "./web3-storage/web3-storage";
import {
  Attachment,
  AttachmentCodec,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec
} from "xmtp-content-type-remote-attachment";
import {fileToUint8Array} from "../../src/utils";
import {Buffer} from "buffer";

const runtimeConnector = new RuntimeConnector(Extension);

// async function decodeAttachment(decodedMsg: DecodedMessage, xmtpClient: Client) {
//   const attachmentFromRemote: Attachment = await RemoteAttachmentCodec.load(
//     decodedMsg.content,
//     xmtpClient.xmtp!
//   );
// }

function App() {
  const msgReceiver = useMemo(() => {
    return "0x30C7832F3912e45C46F762F0D727F77B181d240D";
  }, []);
  const codecs = [new AttachmentCodec(), new RemoteAttachmentCodec()]
  const xmtpClient = useMemo(() => {
    return new Client({
      runtimeConnector,
      appName: import.meta.env.VITE_APP_NAME,
      modelIds: {
        [ModelType.MESSAGE]: import.meta.env.VITE_MESSAGE_MODEL_ID,
        [ModelType.KEYS_CACHE]: import.meta.env.VITE_KEY_CACHE_MODEL_ID,
      } as ModelIds,
      env: "production",
      codecs: codecs,
    });
  }, []);
  const [address, setAddress] = useState("");
  const [pkh, setPkh] = useState("");
  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileCId, setFileCId] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

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

  const isMsgReceiverOnNetwork = async () => {
    const isOnNetwork = await xmtpClient.isUserOnNetwork(
      msgReceiver,
      "production"
    );
    console.log("[isMsgReceiverOnNetwork]:", isOnNetwork);
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
      if (message.senderAddress === xmtpClient.xmtp!.address) {
        continue;
      }
      console.log("[listenNewMsgInConversation]: New message:", message);
    }
  };

  const listenNewMsgInAllConversation = async () => {
    console.log("[listenNewMsgInAllConversation]: start to listen...");
    if(!xmtpClient.xmtp) {
      return;
    }
    const stream = await xmtpClient.getMessageStream();
    for await (const message of stream) {
      if (message.senderAddress === xmtpClient.xmtp!.address) {
        continue;
      }
      console.log("[listenNewMsgInAllConversation]: New message:", message);
      if(message.contentType.typeId === "remoteStaticAttachment") {
        console.log("hit remoteStaticAttachment");
        await RemoteAttachmentCodec.load(
          message.content,
          xmtpClient.xmtp!
        );
      }
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

  const sentMessageWithAttachment = async () => {
    const attFile = file as File;
    const data = await fileToUint8Array(attFile)

    const attachment: Attachment = {
      filename: attFile.name,
      mimeType: attFile.type,
      data: data,
    };

    const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
      attachment,
      new AttachmentCodec()
    );

    const upload = new Upload("", encryptedEncoded.payload);

    const cid = await web3Storage.storeFiles([upload]);
    const url = `https://${cid}.ipfs.w3s.link`;

    const remoteAttachment: RemoteAttachment = {
      url: url,
      contentDigest: encryptedEncoded.digest,
      salt: encryptedEncoded.salt,
      nonce: encryptedEncoded.nonce,
      secret: encryptedEncoded.secret,
      scheme: "https://",
      filename: attachment.filename,
      contentLength: attachment.data.byteLength,
    };

    const options = {
      contentFallback: "[Attachment] Cannot display ${remoteAttachment.filename}. This app does not support attachments yet.",
      contentType: ContentTypeRemoteAttachment
    }

    const decodedMsg = await xmtpClient.sendAttachmentTo({
      user: msgReceiver,
      content: remoteAttachment,
      options: options
    });

    await RemoteAttachmentCodec.load(
      decodedMsg.content,
      xmtpClient.xmtp!
    );
  }
  const handleUploadFile = async () => {
    if (!file) {
      throw new Error("Select a file to upload");
    }
    setUploading(true);
    const cId = await web3Storage.storeFiles([file])
    const url = `https://${cId}.ipfs.w3s.link`;
    console.log("cId : ", cId);
    console.log("url : ", url)
    setUploading(false);
    setFileUrl(url);
  }
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
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
      <button onClick={isMsgReceiverOnNetwork}>isMsgReceiverOnNetwork</button>
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
      <div>
        <input type="file" onChange={handleFileChange}/>
        <button onClick={handleUploadFile} disabled={uploading}>
          uploadFileToIpfs
        </button>
        <div className="blackText">{fileCId}</div>
      </div>
      <hr/>
      <div>
        <button onClick={sentMessageWithAttachment}>sentMessageWithAttachment</button>
      </div>
    </div>
  );
}

export default App;
