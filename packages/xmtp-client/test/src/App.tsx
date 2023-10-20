import { useMemo, useState } from "react";
import Client, {
  ModelIds,
  ModelType,
  DecodedMessage,
  ListMessagesOptions,
  Attachment,
  AttachmentCodec,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
  fileToUint8Array,
} from "@dataverse/xmtp-client-toolkit";
import {
  Extension,
  RESOURCE,
  DataverseConnector,
  WALLET,
  SYSTEM_CALL,
} from "@dataverse/dataverse-connector";
import Upload, { web3Storage } from "./web3-storage/web3-storage";
import { ModelParser, Output } from "@dataverse/model-parser";
import app from "../output/app.json";
import { FileContent } from "@dataverse/dataverse-connector/dist/esm/types/fs";

const dataverseConnector = new DataverseConnector();
const modelParser = new ModelParser(app as Output);

function App() {
  const msgReceiver = useMemo(() => {
    return "0x30C7832F3912e45C46F762F0D727F77B181d240D";
  }, []);
  const xmtpClient = useMemo(() => {
    return new Client({
      dataverseConnector,
      modelIds: {
        [ModelType.MESSAGE]: modelParser.getModelByName("xmtpmessage").streams[0].modelId,
        [ModelType.KEYS_CACHE]: modelParser.getModelByName("xmtpkeycache").streams[0].modelId,
      } as ModelIds,
      env: "production",
    });
  }, []);
  const [address, setAddress] = useState("");
  const [pkh, setPkh] = useState("");
  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileCId, setFileCId] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [msgStream, setMsgStream] = useState<FileContent | null>(null);

  const connectWallet = async () => {
    try {
      const { address } = await xmtpClient.dataverseConnector.connectWallet();
      setAddress(address);
    } catch (error) {
      console.error(error);
    }
  };

  const createCapability = async () => {
    const pkh = await xmtpClient.dataverseConnector.runOS({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId: modelParser.appId,
        resource: RESOURCE.CERAMIC,
      },
    });
    setPkh(pkh);
    console.log(pkh);
    return pkh;
  };

  const checkCapability = async () => {
    const isCurrentPkhValid = await xmtpClient.dataverseConnector.runOS({
      method: SYSTEM_CALL.checkCapability,
    });
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
    const msgList = await xmtpClient.getPersistedMessages();
    setMsgStream(msgList[0]);

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
      const tempArr = [];
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
    if (!xmtpClient.xmtp) {
      return;
    }
    const stream = await xmtpClient.getMessageStream();
    for await (const message of stream) {
      if (message.senderAddress === xmtpClient.xmtp!.address) {
        continue;
      }
      console.log("[listenNewMsgInAllConversation]: New message:", message);
      if (message.contentType.typeId === "remoteStaticAttachment") {
        console.log("hit remoteStaticAttachment");
        const attachmentFromRemote: Attachment =
          await xmtpClient.decodeAttachment(message);
        console.log("attachmentFromRemote: ", attachmentFromRemote);
      }
      const res = await createMsgStream(message);
      console.log("[listenNewMsgInAllConversation]: stream created, res:", res);
    }
  };

  const createMsgStream = async (message: DecodedMessage) => {
    const encrypted = JSON.stringify({
      content: true,
    });

    const fileContent = {
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

    const res = await xmtpClient.dataverseConnector.runOS({
      method: SYSTEM_CALL.createIndexFile,
      params: {
        modelId: import.meta.env.VITE_MESSAGE_MODEL_ID,
        fileContent,
      },
    });

    return res;
  };

  const getPersistedMessages = async () => {
    const res = await xmtpClient.getPersistedMessages();
    console.log("[getPersistedMessages]res:", res);
  };

  const sentMessageWithAttachment = async () => {
    const attFile = file as File;
    const data = await fileToUint8Array(attFile);

    const attachment: Attachment = {
      filename: attFile.name,
      mimeType: attFile.type,
      data: data,
    };

    const encryptedEncoded = await xmtpClient.encodeAttachment(attachment);
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
      contentFallback:
        "[Attachment] Cannot display ${remoteAttachment.filename}. This app does not support attachments yet.",
      contentType: ContentTypeRemoteAttachment,
    };

    await xmtpClient.sendAttachmentTo({
      user: msgReceiver,
      content: remoteAttachment,
      options: options,
    });
  };
  const handleUploadFile = async () => {
    if (!file) {
      throw new Error("Select a file to upload");
    }
    setUploading(true);
    const cId = await web3Storage.storeFiles([file]);
    const url = `https://${cId}.ipfs.w3s.link`;
    console.log("cId : ", cId);
    console.log("url : ", url);
    setUploading(false);
    setFileUrl(url);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const unlockMessage = async () => {
    console.log("msgStream: ", msgStream);
    const res = await dataverseConnector.runOS({
      method: SYSTEM_CALL.unlockFile,
      params: msgStream!.file.fileId,
    });
    console.log("msgStream.file?.fileId", msgStream!.file.fileId);
    console.log(res);
  };

  return (
    <div id="App">
      <div className="app-body">
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
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUploadFile} disabled={uploading}>
            uploadFileToIpfs
          </button>
          <div className="blackText">{fileCId}</div>
        </div>
        <hr />
        <div>
          <button onClick={sentMessageWithAttachment}>
            sentMessageWithAttachment
          </button>
        </div>
        <hr />
        <button onClick={unlockMessage}>unlockMessage</button>
      </div>
    </div>
  );
}

export default App;
