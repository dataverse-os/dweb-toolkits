import "./App.css";
import { useContext, useState } from "react";
import { WALLET } from "@dataverse/runtime-connector";
import {
  SnapshotClient,
  ModelType,
  OrderDirection,
  State,
  Strategy,
  GetActionParams,
  GetProposalsParams,
  SNAP_SHOT_HUB,
  now,
} from "@dataverse/snapshot-client-toolkit";
import { Context } from "./main";
import {
  test_space,
  test_proposal,
  test_space_obj,
  test_vote,
  test_vote_receipt,
} from "./params";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const [address, setAddress] = useState<string>();

  const modelIds = {
    [ModelType.PROPOSAL]: import.meta.env.VITE_PROPOSAL_MODEL_ID,
    [ModelType.VOTE]: import.meta.env.VITE_VOTE_MODEL_ID,
  };
  const snapshotClient = new SnapshotClient({
    runtimeConnector,
    modelIds,
    env: SNAP_SHOT_HUB.dev,
  });

  const createCapability = async () => {
    const { address, wallet } = await runtimeConnector.connectWallet(
      WALLET.METAMASK
    );
    console.log({ address });
    setAddress(address);
    await runtimeConnector.createCapability({
      wallet,
      app: import.meta.env.VITE_APP_NAME,
    });
    console.log("connected");
  };

  const createProposal = async () => {
    const res = await snapshotClient.createProposal(test_proposal);
    console.log("[createProposal]res:", res);
  };

  const vote = async () => {
    const res = await snapshotClient.castVote(test_vote);
    console.log("[vote]res:", res);
  };

  const joinSpace = async () => {
    const res = await snapshotClient.joinSpace(test_space_obj);
    console.log("[joinSpace]res:", res);
  };

  const getScores = async () => {
    const space = "yam.eth";
    const strategies = [
      {
        name: "erc20-balance-of",
        params: {
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          symbol: "DAI",
          decimals: 18,
        },
      } as unknown as Strategy,
    ];
    const network = "1";
    const voters = [
      "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11",
      "0xeF8305E140ac520225DAf050e2f71d5fBcC543e7",
      "0x1E1A51E25f2816335cA436D65e9Af7694BE232ad",
    ];
    const blockNumber = 11437846;

    const res = await snapshotClient.getScores({
      space,
      strategies,
      network,
      voters,
      blockNumber,
    });

    console.log("[getScores]res:", res);
  };

  const getVotePower = async () => {
    const address = "0x66Fe30d178aCE40F50B5d30A35041fCe8e097D98";
    const network = "1";
    const strategies = [
      {
        name: "erc20-balance-of",
        params: {
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          symbol: "DAI",
          decimals: 18,
        },
      } as unknown as Strategy,
    ];
    const snapshot = 11437846;
    const space = test_space;
    const delegation = false;

    const res = await snapshotClient.getVotePower({
      address: address,
      network: network,
      strategies: strategies,
      snapshotNumber: snapshot,
      space: space,
      delegation: delegation,
    });

    console.log("[getVotePower]res:", res);
  };

  const queryActions = async () => {
    const params = {
      space: test_space,
      first: 20,
      skip: 10,
      orderDirection: OrderDirection.asc,
    } as GetActionParams;
    const res = await snapshotClient.getActions(params);
    console.log("[queryActions]res:", res);
  };

  const queryVoteDetail = async () => {
    const voteId = "";
    const res = await snapshotClient.getVoteDetail(voteId);
    console.log("[queryVoteDetail]res:", res);
  };

  const queryProposals = async () => {
    const variables = {
      space: test_space,
      first: 20,
      skip: 0,
      state: State.active,
      orderDirection: OrderDirection.asc,
    } as GetProposalsParams;
    const res = await snapshotClient.getProposals(variables);
    console.log("[queryProposals]res:", res);
  };

  const queryProposalById = async () => {
    const proposalId =
      "0x5d790744b950c5d60e025b3076e1a37022f6a5a2ffcf56ba38e2d85192997ede";
    const res = await snapshotClient.getProposalById(proposalId);
    console.log("[queryProposalById]res:", res);
  };

  const querySpaceDetail = async () => {
    const res = await snapshotClient.getSpaceDetail(test_space);
    console.log("[querySpaceDetail]res:", res);
  };

  return (
    <>
      <button onClick={createCapability}>createCapability</button>
      <br />
      <button onClick={createProposal}>createProposal</button>
      <br />
      <button onClick={vote}>vote</button>
      <br />
      <button onClick={joinSpace}>joinSpace</button>
      <br />
      <button onClick={getScores}>getScores</button>
      <br />
      <button onClick={getVotePower}>getVotePower</button>
      <br />
      <hr />
      <button onClick={queryActions}>queryActions</button>
      <br />
      <button onClick={queryVoteDetail}>queryVoteDetail</button>
      <br />
      <button onClick={queryProposals}>queryProposals</button>
      <br />
      <button onClick={queryProposalById}>queryProposalById</button>
      <br />
      <button onClick={querySpaceDetail}>querySpaceDetail</button>
      <br />
      <hr />
    </>
  );
};

export default App;
