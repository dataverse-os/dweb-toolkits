import "./App.css";
import {useContext, useState} from "react";
import {WALLET} from "@dataverse/runtime-connector";
import {Context} from "./main";
import {SnapshotClient} from "./snapshot-client/client";
import {SNAP_SHOT_HUB, test_proposal, test_space, test_vote} from "./snapshot-client/constants";

const App = () => {
  const {runtimeConnector} = useContext(Context);
  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();

  const snapshotClient = new SnapshotClient(runtimeConnector, SNAP_SHOT_HUB.dev);

  const createCapability = async () => {
    const {address, wallet} = await runtimeConnector.connectWallet(WALLET.METAMASK);
    console.log({address});
    setAddress(address);
    await runtimeConnector.createCapability({
      wallet,
      app: import.meta.env.VITE_APP_NAME,
    });
    console.log("connected");
  };

  const createProposal = async () => {
    await snapshotClient.createProposal(test_proposal);
  }

  const vote = async () => {
    await snapshotClient.castVote(test_vote);
  }

  const getProposalState = async () => {
    console.error("To be implemented")
  }

  const joinSpace = async () => {
    await snapshotClient.joinSpace(test_space);
  }

  return (
    <>
      <button onClick={createCapability}>createCapability</button>
      <br/>
      <button onClick={createProposal}>createProposal</button>
      <br/>
      <button onClick={vote}>vote</button>
      <br/>
      <button onClick={getProposalState}>getProposalState</button>
      <br/>
      <button onClick={joinSpace}>joinSpace</button>
      <br/>
    </>
  );
};

export default App;
