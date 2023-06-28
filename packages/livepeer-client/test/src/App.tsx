import "./App.css";
import { AssetsCreator, LivepeerPlayer } from "./components";
import { LivepeerClient } from "@dataverse/livepeer-client-toolkit";
import { useContext, useMemo, useState } from "react";
import { LivepeerConfig } from "@livepeer/react";
import { Currency, WALLET, StreamContent } from "@dataverse/runtime-connector";
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
    });
  }, []);
  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();
  const [streamContent, setStreamContent] = useState<StreamContent| null>( null);

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
    setStreamContent(assets[0].streamContent)
    console.log("AssetMetaList:", assets);
  };

  const unlockVideo = async () => {
    const content = await livepeerClient.runtimeConnector.unlock({indexFileId: streamContent?.file.indexFileId });
    console.log("unlock content: ", content);
  }

  return (
    <>
      <LivepeerPlayer reactClient={livepeerClient.reactClient} />
      <LivepeerConfig client={livepeerClient.reactClient}>
        <AssetsCreator livepeerClient={livepeerClient} setStreamId={setStreamId} />
        <button onClick={createCapability}>createCapability</button>
        <br />
        <button onClick={retrieveVideo}>retrieveVideo</button>
        <br />
        <button onClick={retrieveVideos}>retrieveVideos</button>
        <br />
        <button onClick={deleteVideo}>deleteVideo</button>
        <br />
        {/* <button onClick={persistVideoMeta}>persistVideoMeta</button>
        <br /> */}
        <button onClick={getVideoMetaList}>getVideoMetaList</button>
        <br />
        <button onClick={monetizeVideoMeta}>monetizeVideoMeta</button>
        <br />
        <button onClick={unlockVideo}>unlockVideo</button>
        <br />
      </LivepeerConfig>
    </>
  );
};

export default App;
