import { RuntimeConnector } from "@dataverse/runtime-connector";
import { BigNumberish, ethers, Wallet } from "ethers";
import { MAX_UINT256, EVENT_SIG_COMMENT_CREATED } from "../constants";
import {
  CommentData,
  CommentWithSigData,
  EIP712Signature,
  EventCommentCreated,
  LensNetwork,
  ModelIds,
} from "../types";

import { ClientBase } from "./base";
import LensHubJson from "../../contracts/LensHub.json";

export class Comment extends ClientBase {
  constructor({
    modelIds,
    runtimeConnector,
    network,
  }: {
    modelIds: ModelIds;
    runtimeConnector: RuntimeConnector;
    network: LensNetwork;
  }) {
    super({
      modelIds,
      runtimeConnector,
      network,
    });
  }

  public async comment(commentData: CommentData) {
    await this.checker.checkCapability();

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "comment",
      params: [commentData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COMMENT_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "comment",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        profileIdPointed: commentData.profileIdPointed,
        pubIdPointed: commentData.pubIdPointed,
        contentURI: commentData.contentURI,
        collectModule: commentData.collectModule,
        referenceModule: commentData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventCommentCreated;
  }

  public async commentWithSig(commentData: CommentData) {
    await this.checker.checkCapability();

    const nonce = await this.getSigNonce();

    const sig = await this._getCommentWithSigPartsByWallet({
      profileId: commentData.profileId,
      contentURI: commentData.contentURI,
      profileIdPointed: commentData.profileIdPointed,
      pubIdPointed: commentData.pubIdPointed,
      referenceModuleData: commentData.referenceModuleData,
      collectModule: commentData.collectModule,
      collectModuleInitData: commentData.collectModuleInitData,
      referenceModule: commentData.referenceModule,
      referenceModuleInitData: commentData.referenceModuleInitData,
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const commentWithSigData: CommentWithSigData = {
      ...commentData,
      sig,
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "commentWithSig",
      params: [commentWithSigData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COMMENT_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "comment",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        profileIdPointed: commentData.profileIdPointed,
        pubIdPointed: commentData.pubIdPointed,
        contentURI: commentData.contentURI,
        collectModule: commentData.collectModule,
        referenceModule: commentData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventCommentCreated;
  }

  private async _getCommentWithSigPartsByWallet({
    profileId,
    contentURI,
    profileIdPointed,
    pubIdPointed,
    referenceModuleData,
    collectModule,
    collectModuleInitData,
    referenceModule,
    referenceModuleInitData,
    nonce,
    deadline,
    wallet,
    lensHubAddr,
    chainId,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    profileIdPointed: BigNumberish;
    pubIdPointed: BigNumberish;
    referenceModuleData: any[];
    collectModule: string;
    collectModuleInitData: any[];
    referenceModule: string;
    referenceModuleInitData: any[];
    nonce: number;
    deadline: string;
    wallet: Wallet;
    lensHubAddr: string;
    chainId: number;
  }): Promise<EIP712Signature> {
    const msgParams = {
      types: {
        CommentWithSig: [
          { name: "profileId", type: "uint256" },
          { name: "contentURI", type: "string" },
          { name: "profileIdPointed", type: "uint256" },
          { name: "pubIdPointed", type: "uint256" },
          { name: "referenceModuleData", type: "bytes" },
          { name: "collectModule", type: "address" },
          { name: "collectModuleInitData", type: "bytes" },
          { name: "referenceModule", type: "address" },
          { name: "referenceModuleInitData", type: "bytes" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      domain: this._domain(lensHubAddr, chainId),
      value: {
        profileId,
        contentURI,
        profileIdPointed,
        pubIdPointed,
        referenceModuleData,
        collectModule,
        collectModuleInitData,
        referenceModule,
        referenceModuleInitData,
        nonce,
        deadline,
      },
    };

    const sig = await wallet._signTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.value
    );
    const { r, s, v } = ethers.utils.splitSignature(sig);

    return {
      r,
      s,
      v,
      deadline,
    } as EIP712Signature;
  }
}
