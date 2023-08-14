import "./App.scss";
import { AssetsCreator, LivepeerPlayer } from "./components";
import { LivepeerClient } from "@dataverse/livepeer-client-toolkit";
import { useContext, useMemo, useState } from "react";
import { LivepeerConfig } from "@livepeer/react";
import {
  Currency,
  StreamContent,
  SYSTEM_CALL,
} from "@dataverse/dataverse-connector";
import { Context } from "./main";

const App = () => {
  console.log('App loaded');
  const { dataverseConnector, modelParser } = useContext(Context);
  const livepeerClient = useMemo(() => {
    console.log(
      "VITE_LIVEPEER_API_KEY:",
      import.meta.env.VITE_LIVEPEER_API_KEY!
    );
    console.log("VITE_MODEL_ID:", modelParser.getModelByName("livepeerasset").streams[0].modelId!);
    console.log("VITE_APP_NAME:", modelParser.appName!);

    return new LivepeerClient({
      apiKey: import.meta.env.VITE_LIVEPEER_API_KEY!,
      dataverseConnector: dataverseConnector,
      modelId: modelParser.getModelByName("livepeerasset").streams[0].modelId,
    });
  }, []);
  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();
  const [streamContent, setStreamContent] = useState<StreamContent | null>(
    null
  );

  const retrieveVideo = async () => {
    const res = await livepeerClient.retrieveVideo(
      "b7614666-64ee-46b4-a417-ea7c42b46aa3"
    );
    console.log("retrieveAsset res:", res);
  };

  const retrieveVideos = async () => {
    const res = await livepeerClient.retrieveVideos();
    console.log("retrieveAssets res:", res);
  };

  const deleteVideo = async () => {
    await livepeerClient.deleteVideo("cdc7ac90-6930-4bed-8c7e-3a2c8850a500");
  };

  const createCapability = async () => {
    const { address } =
      await livepeerClient.dataverseConnector.connectWallet();
    console.log({ address });
    setAddress(address);
    await livepeerClient.dataverseConnector.runOS({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId: modelParser.appId
      },
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
      lensNickName: "tagbug.test",
      datatokenVars: {
        currency: Currency.WMATIC,
        amount: 0.0001,
        collectLimit: 1000,
      },
    });
    console.log("AssetMeta monetized.");
  };

  const getVideoMetaList = async () => {
    const assets = await livepeerClient.getVideoMetaList();
    setStreamContent(assets[0].streamContent);
    console.log("AssetMetaList:", assets);
  };

  const unlockVideo = async () => {
    const content = await livepeerClient.dataverseConnector.runOS({
      method: SYSTEM_CALL.unlock,
      params: {
        indexFileId: streamContent?.file.indexFileId,
      },
    });
    console.log("unlock content: ", content);
  };
  //
  // const testDeleteStream = async () => {
  //   const indexFileId = "kjzl6kcym7w8y9i60b8nori6snffasvc0zwiegtgeh7gt2nifwcqox3xg2t90o2";
  //   const res =  await livepeerClient.dataverseConnector.removeFiles({indexFileIds: [indexFileId]});
  //   console.log("delete res: ", res);
  // }

  return (
    <>
      <LivepeerPlayer reactClient={livepeerClient.reactClient} />
      <LivepeerConfig client={livepeerClient.reactClient}>
        <AssetsCreator
          livepeerClient={livepeerClient}
          setStreamId={setStreamId}
        />
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
        {/*<button onClick={testDeleteStream}>testDeleteStream</button>*/}
        {/*<br />*/}
      </LivepeerConfig>
    </>
  );
};

export default App;
