import "./App.css";
import { useContext, useState } from "react";
import { WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";
import {castVote, createSnapshotProposal, joinSnapshotSpace} from "./snapshot-client/utils";

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

  const createProposal = async () => {
    await createSnapshotProposal(runtimeConnector);
  }

  const vote = async() => {
    await castVote(runtimeConnector);
  }

  const getProposalState = async () => {
    console.error("To be implemented")
  }

  const joinSpace = async () => {
    await joinSnapshotSpace(runtimeConnector);
  }

  return (
    <>
        <button onClick={createCapability}>createCapability</button>
        <br />
        <button onClick={createProposal}>createProposal</button>
        <br />
        <button onClick={vote}>vote</button>
        <br />
        <button onClick={getProposalState}>getProposalState</button>
        <br />
        <button onClick={joinSpace}>joinSpace</button>
        <br />
    </>
  );
};

export default App;
