import {RuntimeConnector} from "@dataverse/runtime-connector";
import snapshot from "@snapshot-labs/snapshot.js";
import Client from "@snapshot-labs/snapshot.js/dist/sign";
import {Wallet} from "ethers";
import {Follow, Message, ModelIds, ModelType, Options, Proposal, Receipt, Strategy, Vote,} from "./types";
import {ERR_ONLY_SPACE_AUTHORS_CAN_PROPOSE, ERR_WRONG_PROPOSAL_FORMAT, now} from "./constants";
import {GraphqlApi} from "./graphql";
import {Checker} from "@dataverse/utils-toolkit";

export class SnapshotClient extends GraphqlApi {
  public modelIds: ModelIds;
  public runtimeConnector: RuntimeConnector;
  public checker: Checker
  public snapShot: Client;
  public env: string;

  constructor({
    runtimeConnector,
    modelIds,
    env,
    apiKey,
  }: {
    runtimeConnector: RuntimeConnector;
    modelIds: ModelIds;
    env: string;
    apiKey?: string;
  }) {
    super({ apiUrl: env, apiKey });
    this.runtimeConnector = runtimeConnector;
    this.checker = new Checker(runtimeConnector);
    this.env = env;
    this.snapShot = new snapshot.Client712(this.env);
    this.modelIds = modelIds;
  }

  async createProposal(proposal: Proposal) {
    this.checker.checkCapability();
    this.checker.checkWallet();
    const { web3, address, msg } = this._buildMessage(proposal);
    return this.snapShot.proposal(
      web3,
      address!,
      msg as Proposal
    ).then((receipt) => {
      this._persistProposal(proposal, receipt);
      return receipt as Receipt;
    }).catch(this._processError)
  }

  async castVote(vote: Vote) {
    this.checker.checkCapability();
    this.checker.checkWallet();
    const { web3, address, msg } = this._buildMessage(vote);
    const receipt = await this.snapShot.vote(web3, address!, msg as Vote);

    await this._persistVote(vote, receipt);
    return receipt;
  }

  async joinSpace(space: Follow) {
    this.checker.checkWallet();
    const { web3, address, msg } = this._buildMessage(space);
    const receipt = await this.snapShot.follow(web3, address!, msg as Follow);
    return receipt;
  }

  async getScores({
    space,
    strategies,
    network,
    voters,
    scoreApiUrl,
    blockNumber,
  }: {
    space: string;
    strategies: Strategy[];
    network: string;
    voters: string[];
    scoreApiUrl?: string;
    blockNumber: number;
  }) {
    const scores = await snapshot.utils.getScores(
      space,
      strategies,
      network,
      voters,
      blockNumber,
      scoreApiUrl
    );

    return scores;
  }

  async getVotePower({
    address,
    network,
    strategies,
    snapshotNumber,
    space,
    delegation,
    options,
  }: {
    address: string;
    network: string;
    strategies: Strategy[];
    snapshotNumber: number | "latest";
    space: string;
    delegation: boolean;
    options?: Options;
  }) {
    const vp = await snapshot.utils.getVp(
      address,
      network,
      strategies,
      snapshotNumber,
      space,
      delegation,
      options
    );

    return vp;
  }

  async validate({
    validation,
    author,
    space,
    network,
    snapshotNumber,
    params,
    options,
  }: {
    validation: string;
    author: string;
    space: string;
    network: string;
    snapshotNumber: number | "latest";
    params: any;
    options: any;
  }) {
    const result = await snapshot.utils.validate(
      validation,
      author,
      space,
      network,
      snapshotNumber,
      params,
      options
    );

    return result;
  }

  async listProposals() {
    return this._listStreamContent(this.modelIds[ModelType.PROPOSAL]);
  }

  async listVotes() {
   return this._listStreamContent(this.modelIds[ModelType.VOTE]);
  }
  private async _listStreamContent(modelId: string) {
    this.checker.checkCapability();
    const pkh = await this.runtimeConnector.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: modelId,
      pkh: pkh,
    });

    const items = [];
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        items.push(streams[key].streamContent);
      }
    }
    return items;
  }
  private _buildMessage(msg: Message){
    const web3 = this.runtimeConnector.signer as unknown as Wallet;
    const address = this.runtimeConnector.address;
    return { web3, address, msg };
  };

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
      app: proposal.app,
    };

    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds[ModelType.PROPOSAL],
      streamContent: content,
    });

    return res;
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
      created_at: now(),
    };

    const res = await this.runtimeConnector.createStream({
      modelId: this.modelIds[ModelType.VOTE],
      streamContent: content,
    });

    return res;
  }


  private _processError = (error: any) => {
    if(error.error_description == ERR_ONLY_SPACE_AUTHORS_CAN_PROPOSE) {
      console.warn(`${ERR_ONLY_SPACE_AUTHORS_CAN_PROPOSE}, you can create a space follow the link, https://docs.snapshot.org/user-guides/spaces/create`);
      return;
    }
    if(error.error_description == ERR_WRONG_PROPOSAL_FORMAT) {
      console.warn(`${ERR_WRONG_PROPOSAL_FORMAT}, check proposal format`);
      return;
    }
    throw new Error(error);
  }
}
