import { Currency, RuntimeConnector } from "@dataverse/runtime-connector";
import { BigNumberish, ethers, Wallet } from "ethers";
import { EVENT_SIG_POST_CREATED, MAX_UINT256 } from "../constants";
import {
  EIP712Signature,
  EventPostCreated,
  LensNetwork,
  ModelIds,
  PostData,
  PostWithSigData,
} from "../types";
import LensHubJson from "../../contracts/LensHub.json";
import { ClientBase } from "./base";

export class Post extends ClientBase {
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

  public async postOnCeramic({
    modelId,
    stream,
    encrypted,
    postParams,
    currency,
    amount,
    collectLimit,
    withSig = false,
  }: {
    modelId: string;
    stream: Object;
    encrypted: Record<string, boolean>;
    postParams: Omit<PostData, "contentURI">;
    currency: Currency;
    amount: number;
    collectLimit: number;
    withSig?: boolean;
  }) {
    await this.checker.checkCapability();

    const streamContent = {
      ...stream,
      encrypted: JSON.stringify(encrypted),
    };

    const { streamId } =
      await this.runtimeConnector.createStream({
        modelId,
        streamContent,
      });

    console.log("streamCreated, streamId:", streamId)

    const {streamContent: monetizedStreamContent} = await this.runtimeConnector.monetizeFile({
      streamId,
      datatokenVars: {
        profileId: postParams.profileId,
        currency,
        amount,
        collectLimit,
      },
    });

    console.log("monitized, monetizedStreamContent:", monetizedStreamContent)

    const postData: PostData = {
      ...postParams,
      contentURI: streamId,
    };

    let res: EventPostCreated;
    if (!withSig) {
      res = await this._post(postData);
    } else {
      res = await this._postWithSig(postData);
    }

    let persistRes;
    try {
      persistRes = await this._persistPublication({
        pubType: "post",
        profileId: res.profileId,
        pubId: res.pubId,
        modelId,
        contentURI: postData.contentURI,
        collectModule: postData.collectModule,
        referenceModule: postData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      publicationStreamId: persistRes?.streamId,
      ...res,
    };
  }

  private async _post(postData: PostData) {
    await this.checker.checkCapability();

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  private async _postWithSig(postData: PostData) {
    await this.checker.checkCapability();

    const nonce = await this.getSigNonce();

    const sig = await this._getPostWithSigPartsByWallet({
      profileId: postData.profileId,
      contentURI: postData.contentURI,
      collectModule: postData.collectModule,
      collectModuleInitData: postData.collectModuleInitData,
      referenceModule: postData.referenceModule,
      referenceModuleInitData: postData.referenceModuleInitData,
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const postWithSigData: PostWithSigData = {
      ...postData,
      sig,
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "postWithSig",
      params: [postWithSigData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    // try {
    //   await this._persistPublication({
    //     pubType: "post",
    //     profileId: (targetEvent as any).topics[1],
    //     pubId: (targetEvent as any).topics[2],
    //     contentURI: postData.contentURI,
    //     collectModule: postData.collectModule,
    //     referenceModule: postData.referenceModule,
    //   });
    // } catch (e) {
    //   console.warn(e);
    // }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  private async _getPostWithSigPartsByWallet({
    profileId,
    contentURI,
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
        PostWithSig: [
          { name: "profileId", type: "uint256" },
          { name: "contentURI", type: "string" },
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
