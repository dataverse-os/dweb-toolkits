import {useState} from 'react'
import {XmtpClient, ModelIds, ModelType, DecodedMessage, ListMessagesOptions} from "@dataverse/xmtp-client-toolkit";
import {Extension, RESOURCE, RuntimeConnector, WALLET} from "@dataverse/runtime-connector";
import {fileToUint8Array, MsgRecipient, MsgRecipient02, uint8ArrayToObjUrl,} from "../xmtp-utils/constants";
import {Client} from "@xmtp/xmtp-js";
import Upload, {web3Storage} from "../web3-storage/web3-storage";
import {
  Attachment,
  AttachmentCodec, ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec
} from "xmtp-content-type-remote-attachment";
import {Buffer} from "buffer";
import {EncryptedEncodedContent} from "xmtp-content-type-remote-attachment/dist/types/RemoteAttachment";
// import {
//   AttachmentCodec,
//   RemoteAttachmentCodec,
// } from "xmtp-content-type-remote-attachment";
// import {Buffer} from "buffer";

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

function XmtpComponent() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [wallet, setWallet] = useState("")
  const [address, setAddress] = useState("")
  const [pkh, setPkh] = useState("")
  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState(false)
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileCId, setFileCId] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

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
      user: MsgRecipient02,
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
      if(message.contentType.typeId === "remoteStaticAttachment") {
        console.log(`New message from ${message.senderAddress}: ${message.content.url}`);
      } else {
        console.log(`New message from ${message.senderAddress}: ${message.content}`);
      }
      await createMsgStream(message);
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

  // const decodeMessageWithAttachment = async () => {
  //   const stream = await xmtp.getMessageStreamOfAllConversation();
  //   for await (const message of stream) {
  //     if (message.senderAddress === (xmtp.xmtp as Client).address) {
  //       // This message was sent from me
  //       continue;
  //     }
  //     console.log("msg: ", message);
  //     console.log("msg: ", message.content);
  //   }
  // }
  const sentMessageWithAttachment = async () => {
    const attFile = file as File;
    const data = await fileToUint8Array(attFile)

    const attachment: Attachment = {
      filename: attFile.name,
      mimeType: attFile.type,
      data: data,
    };

    const objUrl = URL.createObjectURL(
      new Blob([Buffer.from(data)], {
        type: attachment.mimeType,
      }),
    )
    console.log("objUrl: ", objUrl);

    const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
      attachment,
      new AttachmentCodec()
    );

    const upload = new Upload("", encryptedEncoded.payload);

    const cid = await web3Storage.storeFiles([upload]);
    const url = `https://${cid}.ipfs.w3s.link`;
    console.log("cid: ", cid);
    console.log("url: ", url);

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

    const conversation = await (xmtp.xmtp as Client).conversations.newConversation(MsgRecipient02);

    const decodedMsg = await conversation.send(remoteAttachment, {
      contentFallback: "[Attachment] Cannot display ${remoteAttachment.filename}. This app does not support attachments yet.",
      contentType: ContentTypeRemoteAttachment
    });

    console.log("decodedMsg: ", decodedMsg);
    console.log("process download and decode ", );
    const attachmentFromRemote: Attachment = await RemoteAttachmentCodec.load(
      decodedMsg.content,
      (xmtp.xmtp as Client)
    );

    console.log("attachmentFromRemote.filename: ", attachmentFromRemote.filename);
    console.log("attachmentFromRemote.mineType: ", attachmentFromRemote.mimeType);
    console.log("attachmentFromRemote.data: ", attachmentFromRemote.data);
    console.log("file data: ", data);

    const objectURL = URL.createObjectURL(
      new Blob([Buffer.from(attachment.data)], {
        type: attachment.mimeType,
      }),
    );

    // const objUrlFromRemote = uint8ArrayToObjUrl(attachmentFromRemote.data, attachmentFromRemote.mimeType);
    // console.log("objUrlFromRemote: ", objUrlFromRemote);
    console.log("objectURL: ", objectURL);
    console.log("decodedMsg.content.url ", decodedMsg.content.url);
    // await Client.sendMessageFromHook(remoteAttachment, {
    //   contentFallback: "[Attachment] Cannot display ${remoteAttachment.filename}. This app does not support attachments yet."
    //   contentType: ContentTypeRemoteAttachment,
    // });

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
        {/*<button onClick={decodeMessageWithAttachment}>decodeMessageWithAttachment</button>*/}
        {/*<hr/>*/}
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
    </>
  )
}

export default XmtpComponent;