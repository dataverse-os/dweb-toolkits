import "./App.css";
import { AssetsCreator, LivepeerPlayer } from "./components";
import { LivepeerClient } from "@dataverse/livepeer-client-toolkit";
import { useContext, useMemo, useState } from "react";
import { LivepeerConfig } from "@livepeer/react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const livepeerClient = useMemo(() => {
    console.log(
      "VITE_LIVEPEER_API_KEY:",
      import.meta.env.VITE_LIVEPEER_API_KEY!
    );
    console.log("VITE_MODEL_ID:", import.meta.env.VITE_MODEL_ID!);
    console.log("VITE_APP_NAME:", import.meta.env.VITE_APP_NAME!);

    return new LivepeerClient({
      apiKey: import.meta.env.VITE_LIVEPEER_API_KEY!,
      runtimeConnector: runtimeConnector,
      modelId: import.meta.env.VITE_MODEL_ID,
      appName: import.meta.env.VITE_APP_NAME,
    });
  }, []);
  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();

  const retrieveVideo = async () => {
    const res = await livepeerClient.retrieveVideo(
      "be869964-4ec4-4652-bb5b-22a09112d717"
    );
    console.log("retrieveAsset res:", res);
  };

  const retrieveVideos = async () => {
    const res = await livepeerClient.retrieveVideos();
    console.log("retrieveAssets res:", res);
  };

  const deleteVideo = async () => {
    await livepeerClient.deleteVideo(
      "5561fd95-cc5b-47a9-bb79-d6d460f79883"
    );
  };

  const createCapability = async () => {
    const { address, wallet } =
      await livepeerClient.runtimeConnector.connectWallet(WALLET.METAMASK);
    console.log({ address });
    setAddress(address);
    await livepeerClient.runtimeConnector.createCapability({
      wallet,
      app: import.meta.env.VITE_APP_NAME,
    });
    console.log("connected");
  };

  const persistVideoMeta = async () => {
    const asset = {
      "id": "20c4d9ad-bfab-4808-867f-5f03605ad153",
      "hash": [
        {
          "hash": "59b8487da4236b3d42890fedab86ac64",
          "algorithm": "md5"
        },
        {
          "hash": "ce4bfdc8fda0c1a3393dbb6850de2bee1f44e9be6839a377499009dde493a1f8",
          "algorithm": "sha256"
        }
      ],
      "name": "SampleVideo_360x240_1mb.mp4",
      "size": 1053651,
      "source": {
        "type": "directUpload"
      },
      "status": {
        "phase": "ready",
        "updatedAt": 1686889151084
      },
      "userId": "465c2ff6-de57-43e1-a2c8-2ef60413ea95",
      "createdAt": 1686889112237,
      "videoSpec": {
        "format": "mp4",
        "duration": 13.696
      },
      "playbackId": "20c4lmgadz8lrqr7",
      "playbackUrl": "https://lp-playback.com/hls/20c4lmgadz8lrqr7/index.m3u8",
      "downloadUrl": "https://lp-playback.com/hls/20c4lmgadz8lrqr7/video"
    };

    const { streamId } = await livepeerClient.persistAssetMeta(asset);
    setStreamId(streamId);
    console.log("AssetMeta persist.");
  };

  const monetizeVideoMeta = async () => {
    if (!address || !streamId) {
      console.error("address or streamId undefined");
      return;
    }
    await livepeerClient.monetizeVideoMeta({
      address,
      streamId,
      lensNickName: "jackieth",
      datatokenVars: {
        currency: Currency.WMATIC,
        amount: 0.0001,
        collectLimit: 1000,
      },
    });
    console.log("AssetMeta monetized.")
  };

  const getVideoMetaList = async () => {
    const assets = await livepeerClient.getVideoMetaList();
    console.log("AssetMetaList:", assets);
  };

  return (
    <>
      <LivepeerPlayer reactClient={livepeerClient.reactClient} />
      <LivepeerConfig client={livepeerClient.reactClient}>
        <AssetsCreator livepeerClient={livepeerClient} />
        <button onClick={createCapability}>createCapability</button>
        <br />
        <button onClick={retrieveVideo}>retrieveVideo</button>
        <br />
        <button onClick={retrieveVideos}>retrieveVideos</button>
        <br />
        <button onClick={deleteVideo}>deleteVideo</button>
        <br />
        <button onClick={persistVideoMeta}>persistVideoMeta</button>
        <br />
        <button onClick={getVideoMetaList}>getVideoMetaList</button>
        <br />
        <button onClick={monetizeVideoMeta}>monetizeVideoMeta</button>
        <br />
      </LivepeerConfig>
    </>
  );
};

export default App;
