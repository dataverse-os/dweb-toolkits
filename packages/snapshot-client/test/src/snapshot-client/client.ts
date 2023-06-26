import {RuntimeConnector} from "@dataverse/runtime-connector";
import snapshot from "@snapshot-labs/snapshot.js";
import Client from "@snapshot-labs/snapshot.js/dist/sign";
import {Proposal, Vote} from "@snapshot-labs/snapshot.js/src/sign/types";
import {Wallet} from "ethers";
import {Follow, Message} from "./types";

export class SnapshotClient {
  // public appName: string;
  // public modelId: string;
  public runtimeConnector: RuntimeConnector;
  public snapShot: Client
  // public web3: Web3Provider | Wallet
  public env: string;

  constructor(runtimeConnector: RuntimeConnector, env: string) {
    this.runtimeConnector = runtimeConnector;
    this.env = env;
    this.snapShot = new snapshot.Client712(this.env)
  }

  async createProposal(proposal: Proposal) {
    const {web3, address, msg} = this.buildMessage(proposal);
    const receipt = await this.snapShot.proposal(web3, address, msg as Proposal);

    console.log("receipt:", receipt)
    return receipt;
  }

  async joinSpace(space: Follow) {
    const {web3, address, msg} = this.buildMessage(space);
    const receipt = await this.snapShot.follow(web3, address, msg as Follow);

    console.log("join space receipt :", receipt)
    return receipt;
  }

  async castVote(vote: Vote) {
    const {web3, address, msg} = this.buildMessage(vote);
    const receipt = await this.snapShot.vote(web3, address, msg as Vote);

    console.log("cast vote receipt: ", receipt);
    return receipt;
  }

  buildMessage = (msg: Message) => {
    const web3 = this.runtimeConnector.signer as unknown as Wallet;
    const address = this.runtimeConnector.address;
    return {web3, address, msg};
  }
}