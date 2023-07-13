import "./App.scss";
import { useContext, useState } from "react";
import { Methods, WALLET } from "@dataverse/core-connector";
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
import { proposal_template, vote_template } from "./params";

const App = () => {
  const { coreConnector } = useContext(Context);
  const [address, setAddress] = useState<string>();
  const [proposalId, setProposalId] = useState<string>();
  const [spaceId, setSpaceId] = useState<string>();
  const [voteId, setVoteId] = useState<string>();

  const modelIds = {
    [ModelType.PROPOSAL]: import.meta.env.VITE_PROPOSAL_MODEL_ID,
    [ModelType.VOTE]: import.meta.env.VITE_VOTE_MODEL_ID,
  };
  const snapshotClient = new SnapshotClient({
    coreConnector,
    modelIds,
    env: SNAP_SHOT_HUB.dev,
  });

  const createCapability = async () => {
    const { address, wallet } = await coreConnector.connectWallet(
      WALLET.METAMASK
    );
    console.log({ address });
    setAddress(address);
    await coreConnector.runOS({
      method: Methods.createCapability,
      params: {
        wallet,
        app: import.meta.env.VITE_APP_NAME,
      },
    });
    console.log("connected");
  };

  const createProposal = async () => {
    if (!spaceId) {
      alert("please enter spaceId ...");
      return;
    }
    const proposal = proposal_template;
    proposal.space = spaceId as string;
    const res = await snapshotClient.createProposal(proposal);
    setProposalId(res.id);
    console.log("[createProposal]res: ", res);
  };

  const vote = async () => {
    const vote = vote_template;
    if (!proposalId) {
      alert("create a proposal first");
      return;
    }
    vote.proposal = proposalId as string;
    const res = await snapshotClient.castVote(vote);
    console.log("[vote]res:", res);
    setVoteId(res.id);
  };

  const joinSpace = async () => {
    if (!spaceId) {
      alert("please enter spaceId ...");
      return;
    }
    const spaceTemplate = {
      space: spaceId as string,
    };
    const res = await snapshotClient.joinSpace(spaceTemplate);
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
    const space = spaceId as string;
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
    if (!spaceId) {
      alert("please enter spaceId ...");
      return;
    }
    const params = {
      space: spaceId,
      first: 20,
      skip: 10,
      orderDirection: OrderDirection.asc,
    } as GetActionParams;
    const res = await snapshotClient.getActions(params);
    console.log("[queryActions]res:", res);
  };

  const queryVoteDetail = async () => {
    if (!voteId) {
      alert("vote before query vote detail");
      return;
    }
    console.log("voteId: ", voteId);
    const res = await snapshotClient.getVoteDetail(voteId);
    console.log("[queryVoteDetail]res:", res);
  };

  const queryProposals = async () => {
    if (!spaceId) {
      alert("please enter space Id");
      return;
    }
    const variables = {
      space: spaceId,
      first: 20,
      skip: 0,
      state: State.active,
      orderDirection: OrderDirection.asc,
    } as GetProposalsParams;
    const res = await snapshotClient.getProposals(variables);
    console.log("[queryProposals]res:", res);
  };

  const queryProposalById = async () => {
    if (!proposalId) {
      alert("please create a proposal");
      return;
    }
    const res = await snapshotClient.getProposalById(proposalId as string);
    console.log("[queryProposalById]res:", res);
  };

  const querySpaceDetail = async () => {
    if (!spaceId) {
      alert("please enter space Id");
      return;
    }
    const res = await snapshotClient.getSpaceDetail(spaceId);
    console.log("[querySpaceDetail]res:", res);
  };

  const listProposals = async () => {
    const res = await snapshotClient.listProposals();
    console.log("[listProposals]res:", res);
  };

  const listVotes = async () => {
    const res = await snapshotClient.listVotes();
    console.log("[listVotes]res:", res);
  };

  return (
    <>
      <button onClick={createCapability}>createCapability</button>
      <br />
      <input
        type="text"
        value={spaceId}
        placeholder="spaceId: toolkits.eth"
        onChange={(event) => setSpaceId(event.target.value)}
      />
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
      <button onClick={listProposals}>listProposals</button>
      <br />
      <button onClick={listVotes}>listVotes</button>
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
