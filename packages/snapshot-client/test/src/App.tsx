import "./App.css";
import { useContext, useMemo, useState } from "react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";

const App = () => {
  const { runtimeConnector } = useContext(Context);

  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();


  const createCapability = async () => {
    const { address, wallet } =
      await runtimeConnector.connectWallet(WALLET.METAMASK);
    console.log({ address });
    setAddress(address);
    await runtimeConnector.createCapability({
      wallet,
      app: import.meta.env.VITE_APP_NAME,
    });
    console.log("connected");
  };

  return (
    <>
        <button onClick={createCapability}>createCapability</button>
        <br />
    </>
  );
};

export default App;
