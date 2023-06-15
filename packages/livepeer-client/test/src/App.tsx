import "./App.css";
import { AssetsCreator, LivepeerPlayer } from "./components";
import { LivepeerClient } from "@dataverse/livepeer-client-toolkit";
import { useContext, useMemo } from "react";
import { LivepeerConfig } from "@livepeer/react";
import { WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const livePeerClient = useMemo(() => {
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

  const retrieveAssetById = async () => {
    const res = await livePeerClient.retrieveAssetById(
      "be869964-4ec4-4652-bb5b-22a09112d717"
    );
    console.log("retrieveAssetById res:", res);
  };

  const retrieveAssets = async () => {
    const res = await livePeerClient.retrieveAssets();
    console.log("retrieveAssets res:", res);
  };

  const deleteAssetById = async () => {
    await livePeerClient.deleteAssetById(
      "5561fd95-cc5b-47a9-bb79-d6d460f79883"
    );
  };

  const createCapability = async () => {
    await livePeerClient.runtimeConnector.createCapability({
      wallet: WALLET.METAMASK,
      app: import.meta.env.VITE_APP_NAME,
    });
  };

  const persistAssetMeta = async () => {
    const asset = {
      id: "fd926a0a-9a1d-481c-9320-3f660f6c583c",
      hash: [
        {
          hash: "59b8487da4236b3d42890fedab86ac64",
          algorithm: "md5",
        },
        {
          hash: "ce4bfdc8fda0c1a3393dbb6850de2bee1f44e9be6839a377499009dde493a1f8",
          algorithm: "sha256",
        },
      ],
      name: "SampleVideo_360x240_1mb.mp4",
      size: 1053651,
      source: {
        type: "directUpload",
      },
      status: {
        phase: "ready",
        updatedAt: 1686288965902,
      },
      userId: "465c2ff6-de57-43e1-a2c8-2ef60413ea95",
      createdAt: 1686288914975,
      videoSpec: {
        format: "mp4",
        duration: 13.696,
      },
      playbackId: "fd92jdwxbill3hye",
      playbackUrl: "https://lp-playback.com/hls/fd92jdwxbill3hye/index.m3u8",
      downloadUrl: "https://lp-playback.com/hls/fd92jdwxbill3hye/video",
    };

    await livePeerClient.persistAssetMeta(asset);
    console.log("AssetMeta persist.");
  };

  const removeAssetMetaByAssetId = async () => {
    const assetId = "6f8e2e9c-7670-4777-ac08-d558045ff44f";
    await livePeerClient.removeAssetMetaByAssetId(assetId);
    console.log("AssetMeta removed.");
  };

  const updateAssetMetaStream = async () => {
    const asset = {
      id: "dd3565d4-24eb-46bf-8116-99b7991b791d",
      hash: [
        {
          hash: "59b8487da4236b3d42890fedab86ac64",
          algorithm: "md5",
        },
        {
          hash: "ce4bfdc8fda0c1a3393dbb6850de2bee1f44e9be6839a377499009dde493a1f8",
          algorithm: "sha256",
        },
      ],
      name: "SampleVideo_360x240_1mb.mp4",
      size: 1053651,
      source: {
        type: "directUpload2",
      },
      status: {
        phase: "ready",
        updatedAt: 1686309267324,
      },
      userId: "465c2ff6-de57-43e1-a2c8-2ef60413ea95",
      createdAt: 1686309229112,
      videoSpec: {
        format: "mp4",
        duration: 13.696,
      },
      playbackId: "dd35xm3cf3s1h5kk",
      playbackUrl: "https://lp-playback.com/hls/dd35xm3cf3s1h5kk/index.m3u8",
      downloadUrl: "https://lp-playback.com/hls/dd35xm3cf3s1h5kk/video",
    };
    await livePeerClient.updateAssetMeta(asset);
    console.log("AssetMeta updated.");
  };
  const getAssetMetaList = async() => {
    const assets = await livePeerClient.getAssetMetaList();
    console.log("AssetMetaList:", assets);
  }

  return (
    <>
      <LivepeerPlayer reactClient={livePeerClient.reactClient} />
      <LivepeerConfig client={livePeerClient.reactClient}>
        <AssetsCreator livepeerClient={livePeerClient} />
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
        <button onClick={removeAssetMetaByAssetId}>
          removeAssetMetaByAssetId
        </button>
        <br />
        <button onClick={updateAssetMetaStream}>updateAssetMetaStream</button>
        <br />
        <button onClick={getAssetMetaList}>getAssetList</button>
        <br />
      </LivepeerConfig>
    </>
  );
};

export default App;
