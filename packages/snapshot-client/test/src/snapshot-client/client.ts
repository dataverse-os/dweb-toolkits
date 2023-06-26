import {RuntimeConnector} from "@dataverse/runtime-connector";
import snapshot from "@snapshot-labs/snapshot.js";
import Client from "@snapshot-labs/snapshot.js/dist/sign";
import {Wallet} from "ethers";
import {Proposal, Vote, Follow, Message, Options, Strategy} from "./types";

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

  async getScores(
    {space, strategies, network, voters, scoreApiUrl, blockNumber}:
      {
        space: string,
        strategies: Strategy[],
        network: string,
        voters: string[],
        scoreApiUrl?: string,
        blockNumber: number
      }) {

    const scores = await snapshot.utils.getScores(
      space,
      strategies,
      network,
      voters,
      blockNumber
    )

    console.log('Scores', scores);
    return scores;
  }

  async getVp({address, network, strategies, snapshotNumber, space, delegation, options}: {
    address: string,
    network: string,
    strategies: Strategy[],
    snapshotNumber: number | 'latest',
    space: string,
    delegation: boolean,
    options?: Options
  }) {

    const vp = await snapshot.utils.getVp(address, network, strategies, snapshotNumber, space, delegation)

    console.log('Voting Power', vp);
    return vp
  }

  async validate(
    {
      validation,
      author,
      space,
      network,
      snapshotNumber,
      params,
      options
    }: {
      validation: string,
      author: string,
      space: string,
      network: string,
      snapshotNumber: number | 'latest',
      params: any,
      options: any
    }) {


    const result = await snapshot.utils.validate(
      validation, author, space, network, snapshotNumber, params, options
    )

    console.log('Validation Result', result);
  }


  buildMessage = (msg: Message) => {
    const web3 = this.runtimeConnector.signer as unknown as Wallet;
    const address = this.runtimeConnector.address;
    return {web3, address, msg};
  }
}