import snapshot from '@snapshot-labs/snapshot.js';
import {SNAP_SHOT_HUB} from "./constants";

import { Web3Provider } from '@ethersproject/providers';
import {Signer, Wallet} from "ethers";
import {RuntimeConnector} from "@dataverse/runtime-connector";
import {ONE_DAY} from "./constants";
export const snapshotClient = new snapshot.Client712(SNAP_SHOT_HUB.dev);

export const createSnapshotProposal = async (runtimeConnector: RuntimeConnector) => {
  const provider = await runtimeConnector.provider;
  const address = await runtimeConnector.address;

  const web3 = new Web3Provider(provider);
  // const [account] = await web3.listAccounts();
  const now =Number((new Date().getTime() / 1000).toFixed(0));


  const receipt = await snapshotClient.proposal(web3, address, {
    space: 'toolkits.eth',
    type: 'single-choice', // define the voting system
    title: 'p_02',
    body: 'proposal_p_02',
    choices: ['option01', 'option02', 'option03'],
    discussion: "",
    start: now,
    end: now + ONE_DAY,
    snapshot: 17561820,
    plugins: JSON.stringify({}),
    app: 'my-app' // provide the name of your project which is using this snapshot.js integration
  });

  console.log("receipt:", receipt)
  return receipt;
}

export const castVote = async (runtimeConnector: RuntimeConnector) => {

  const web3 = new Web3Provider(runtimeConnector.provider);
  const address = runtimeConnector.address;

  const receipt = await snapshotClient.vote(web3, address, {
    space: 'toolkits.eth',
    proposal: '0x7183b5e162a652e87487192f1bec67f2bc858a3cbb8218e3ed1fc573f81e5ccd',
    type: 'single-choice',
    choice: 1,
    reason: 'Choice 1 make lot of sense',
    app: 'my-app'
  });
  console.log("cast vote receipt: ", receipt);
  return receipt;
}

export const joinSnapshotSpace = async (runtimeConnector: RuntimeConnector) => {
  const web3 = new Web3Provider(runtimeConnector.provider);
  const address = runtimeConnector.address;

  const receipt = await snapshotClient.follow(web3, address, {
    space:"toolkits.eth"
  });
  console.log("join space receipt :", receipt)

  return receipt;
}