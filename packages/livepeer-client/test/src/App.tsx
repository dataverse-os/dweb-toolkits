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

  const retrieveAssetById = async () => {
    const res = await livepeerClient.retrieveAssetById(
      "be869964-4ec4-4652-bb5b-22a09112d717"
    );
    console.log("retrieveAssetById res:", res);
  };

  const retrieveAssets = async () => {
    const res = await livepeerClient.retrieveAssets();
    console.log("retrieveAssets res:", res);
  };

  const deleteAssetById = async () => {
    await livepeerClient.deleteAssetById(
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

  const persistAssetMeta = async () => {
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

  const updateAssetMetaStream = async () => {
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
      "name": "SampleVideo_360x240_1mb_nice_v3.mp4",
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
    await livepeerClient.updateAssetMeta(asset);
    console.log("AssetMeta updated.");
    // await livePeerClient.updateAssetMetaOrigin(asset);
    console.log("AssetMeta updated.");
  };

  const monetizeAssetMeta = async () => {
    if (!address || !streamId) {
      console.error("address or streamId undefined");
      return;
    }
    await livepeerClient.monetizeAssetMeta({
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

  const getAssetMetaList = async () => {
    const assets = await livepeerClient.getAssetMetaList();
    console.log("AssetMetaList:", assets);
  };

  return (
    <>
      <LivepeerPlayer reactClient={livepeerClient.reactClient} />
      <LivepeerConfig client={livepeerClient.reactClient}>
        <AssetsCreator livepeerClient={livepeerClient} />
        <button onClick={createCapability}>createCapability</button>
        <br />
        <button onClick={retrieveAssetById}>retrieveAssetById</button>
        <br />
        <button onClick={retrieveAssets}>retrieveAssets</button>
        <br />
        <button onClick={deleteAssetById}>deleteAssetById</button>
        <br />
        <button onClick={persistAssetMeta}>persistAssetMeta</button>
        <br />
        <button onClick={updateAssetMetaStream}>updateAssetMetaStream</button>
        <br />
        <button onClick={getAssetMetaList}>getAssetMetaList</button>
        <br />
        <button onClick={monetizeAssetMeta}>monetizeAssetMeta</button>
        <br />
      </LivepeerConfig>
    </>
  );
};

export default App;
