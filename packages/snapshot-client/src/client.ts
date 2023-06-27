import {RuntimeConnector} from "@dataverse/runtime-connector";
import snapshot from "@snapshot-labs/snapshot.js";
import Client from "@snapshot-labs/snapshot.js/dist/sign";
import {Wallet} from "ethers";
import {Proposal, Vote, Follow, Message, Options, Strategy, ModelIds, ModelType} from "./types";
import {now} from "./constants";
import {GraphqlApi} from "./graphql";

export class SnapshotClient extends GraphqlApi{
  public appName: string;
  public modelIds: ModelIds;
  public runtimeConnector: RuntimeConnector;
  public snapShot: Client
  // public web3: Web3Provider | Wallet
  public env: string;

  constructor({
    runtimeConnector,
    appName,
    modelIds,
    env,
    apiKey
  }: {
    runtimeConnector: RuntimeConnector, appName: string, modelIds: ModelIds, env: string, apiKey?: string
  }) {
    super({apiUrl: env, apiKey});
    this.runtimeConnector = runtimeConnector;
    this.appName = appName;
    this.env = env;
    this.snapShot = new snapshot.Client712(this.env);
    this.modelIds = modelIds;
  }

  async createProposal(proposal: Proposal) {
    const {web3, address, msg} = this.buildMessage(proposal);
    const receipt = await this.snapShot.proposal(web3, address!, msg as Proposal);
    console.log("receipt:", receipt)
    await this._persistProposal(proposal, receipt);
    return receipt;
  }

  async castVote(vote: Vote) {
    const {web3, address, msg} = this.buildMessage(vote);
    const receipt = await this.snapShot.vote(web3, address!, msg as Vote);

    await this._persistVote(vote, receipt);
    return receipt;
  }


  async joinSpace(space: Follow) {
    const {web3, address, msg} = this.buildMessage(space);
    const receipt = await this.snapShot.follow(web3, address!, msg as Follow);

    console.log("join space receipt :", receipt)
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
      blockNumber,
      scoreApiUrl
    )

    console.log('Scores', scores);
    return scores;
  }

  async getVotePower({address, network, strategies, snapshotNumber, space, delegation, options}: {
    address: string,
    network: string,
    strategies: Strategy[],
    snapshotNumber: number | 'latest',
    space: string,
    delegation: boolean,
    options?: Options
  }) {

    const vp = await snapshot.utils.getVp(address, network, strategies, snapshotNumber, space, delegation, options)

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

  private async _persistProposal(proposal: Proposal, receipt: any) {
    const content = {
      proposal_id: receipt.id,
      ipfs: receipt.ipfs,
      title: proposal.title,
      body: proposal.body,
      choices: JSON.stringify(proposal.choices),
      start: proposal.start,
      end: proposal.end,
      snapshot: proposal.snapshot.toString(),
      space: proposal.space,
      relayer_address: receipt.relayer.address,
      relayer_receipt: receipt.relayer.receipt,
      created_at: now(),
      type: proposal.type ?? "",
      app: proposal.app
    }

    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds[ModelType.PROPOSAL],
      streamContent: content
    })
    console.log("_persistProposal: res", res);
  }

  private async _persistVote(vote: Vote, receipt: any) {
    const content = {
      vote_id: receipt.id,
      proposal_id: vote.proposal,
      ipfs: receipt.ipfs,
      space: vote.space,
      type: vote.type ?? "",
      reason: vote.reason,
      relayer_address: receipt.relayer.address,
      relayer_receipt: receipt.relayer.receipt,
      app: vote.app,
      created_at: now()
    }

    console.log("content : ", content);
    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds[ModelType.VOTE],
      streamContent: content
    });
    console.log("create vote stream res: ", res);
  }
}