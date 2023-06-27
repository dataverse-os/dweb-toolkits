import "./App.css";
import {useContext, useState} from "react";
import {WALLET} from "@dataverse/runtime-connector";
import {Context} from "./main";
import {SnapshotClient} from "./snapshot-client/client";
import {
  AppName,
  now,
  ProposalModelId,
  SNAP_SHOT_HUB,
  test_space,
  test_proposal,
  test_space_obj,
  test_vote, test_vote_receipt,
  VoteModelId
} from "./snapshot-client/constants";
import {Strategy} from "@snapshot-labs/snapshot.js/dist/voting/types";
import {getActions, getProposalById, getProposals, getSpaceDetail, getVoteDetail} from "./graphql-client/graphql";
import {GetActionParams, GetProposalsParams, OrderDirection, State} from "./graphql-client/types";
import {ModelType} from "./snapshot-client/types";

const App = () => {
  const {runtimeConnector} = useContext(Context);
  const [address, setAddress] = useState<string>();
  const [streamId, setStreamId] = useState<string>();

  const modelIds = {
    [ModelType.PROPOSAL]: ProposalModelId,
    [ModelType.VOTE]: VoteModelId
  }
  const snapshotClient = new SnapshotClient({
    runtimeConnector, modelIds, appName: AppName, env: SNAP_SHOT_HUB.dev
  });

  const createCapability = async () => {
    const {address, wallet} = await runtimeConnector.connectWallet(WALLET.METAMASK);
    console.log({address});
    setAddress(address);
    await runtimeConnector.createCapability({
      wallet,
      app: AppName,
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
    await snapshotClient.joinSpace(test_space_obj);
  }

  const getScores = async () => {
    const space = 'yam.eth';
    const strategies = [
      {
        name: 'erc20-balance-of',
        params: {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'DAI',
          decimals: 18
        }
      } as unknown as Strategy
    ];
    const network = '1';
    const voters = [
      '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
      '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
      '0x1E1A51E25f2816335cA436D65e9Af7694BE232ad'
    ];
    const blockNumber = 11437846;

    await snapshotClient.getScores({
      space,
      strategies,
      network,
      voters,
      blockNumber
    });
  }

  const getVotePower = async () => {
    const address = '0x66Fe30d178aCE40F50B5d30A35041fCe8e097D98';
    const network = '1';
    const strategies = [
      {
        name: 'erc20-balance-of',
        params: {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'DAI',
          decimals: 18
        }
      } as unknown as Strategy
    ];
    const snapshot = 11437846;
    const space = test_space;
    const delegation = false;

    await snapshotClient.getVotePower({
      address: address,
      network: network,
      strategies: strategies,
      snapshotNumber: snapshot,
      space: space,
      delegation: delegation
    });
  }

  // const validate = async () => {
  //   const validationName = 'basic';
  //   const author = '0xb5AB443DfF53F0e397a9E0778A3343Cbaf4D001a';
  //   const spaceId = test_ens;
  //   const networkId = '5';
  //   const snapshotNumber = 17561820;
  //   const validationParams = {
  //     minScore: 1
  //   };
  //   const options = {};
  //
  //   const ret = await snapshotClient.validate({
  //     validation: validationName,
  //     author: author,
  //     space: spaceId,
  //     network: networkId,
  //     snapshotNumber:snapshotNumber,
  //     params: validationParams,
  //     options: options,
  //   });
  //
  // }

  const queryActions = async () => {
    const params = {
      space: test_space,
      first: 20,
      skip: 10,
      orderDirection: OrderDirection.asc
    } as GetActionParams
    await getActions(params);
  }

  const queryVoteDetail = async () => {
    const voteId = ""
    await getVoteDetail(voteId);
  }

  const queryProposals = async () => {
    const variables = {
      space: test_space,
      first: 20,
      skip: 0,
      state: State.active,
      orderDirection: OrderDirection.asc
    } as GetProposalsParams;
    await getProposals(variables);
  }

  const queryProposalById = async () => {
    const proposalId = "0x5d790744b950c5d60e025b3076e1a37022f6a5a2ffcf56ba38e2d85192997ede"
    await getProposalById(proposalId);
  }

  const querySpaceDetail = async () => {
    await getSpaceDetail(test_space);
  }

  const createStream = async () => {
    await runtimeConnector.createCapability({app: AppName});

    const content = {
      vote_id: test_vote_receipt.id,
      proposal_id: test_vote.proposal,
      ipfs: test_vote_receipt.ipfs,
      space: test_vote.space,
      type: test_vote.type,
      reason: test_vote.reason,
      relayer_address: test_vote_receipt.relayer.address,
      relayer_receipt: test_vote_receipt.relayer.receipt,
      app: test_vote.app,
      created_at: now()
    }
    const res = await runtimeConnector.createStream({modelId: modelIds[ModelType.VOTE], streamContent: content});
    console.log("create vote stream res: ", res);
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
      <button onClick={getScores}>getScores</button>
      <br/>
      <button onClick={getVotePower}>getVotePower</button>
      <br/>
      <hr/>
      {/*<button onClick={validate}>validate</button>*/}
      {/*<br/>*/}
      <button onClick={queryActions}>queryActions</button>
      <br/>
      <button onClick={queryVoteDetail}>queryVoteDetail</button>
      <br/>
      <button onClick={queryProposals}>queryProposals</button>
      <br/>
      <button onClick={queryProposalById}>queryProposalById</button>
      <br/>
      <button onClick={querySpaceDetail}>querySpaceDetail</button>
      <br/>
      <hr/>
      <button onClick={createStream}>createStream</button>
      <br/>

    </>
  );
};

export default App;
