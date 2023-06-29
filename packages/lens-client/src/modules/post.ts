import { RuntimeConnector } from "@dataverse/runtime-connector";
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

  public async postStream({
    modelId,
    stream,
    encrypted,
    postParams,
    withSig = false,
  }: {
    modelId: string;
    stream: Object;
    encrypted: Record<string, boolean>;
    postParams: Omit<PostData, "contentURI">;
    withSig?: boolean;
  }) {
    await this.checker.checkCapability();

    const streamContent = {
      ...stream,
      encrypted: JSON.stringify(encrypted),
    };

    const { streamId } = await this.runtimeConnector.createStream({
      modelId,
      streamContent,
    });

    const postData: PostData = {
      ...postParams,
      contentURI: streamId,
    };

    if (!withSig) {
      return this.post(postData);
    } else {
      return this.postWithSig(postData);
    }
  }

  public async post(postData: PostData) {
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

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI: postData.contentURI,
        collectModule: postData.collectModule,
        referenceModule: postData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async postWithSig(postData: PostData) {
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

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI: postData.contentURI,
        collectModule: postData.collectModule,
        referenceModule: postData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createFreeCollectPost({
    profileId,
    contentURI,
    collectModuleInitParams,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    collectModuleInitParams: {
      followerOnly: boolean;
    };
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [collectModuleInitParams.followerOnly]
    );

    const postData: PostData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FreeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.FreeCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createRevertCollectPost({
    profileId,
    contentURI,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const postData: PostData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.RevertCollectModule,
      collectModuleInitData: [],
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.RevertCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createFeeCollectPost({
    profileId,
    contentURI,
    collectModuleInitParams,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    collectModuleInitParams: {
      amount: BigNumberish;
      currency: string;
      recipient: string;
      referralFee: BigNumberish;
      followerOnly: boolean;
    };
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [
        collectModuleInitParams.amount,
        collectModuleInitParams.currency,
        collectModuleInitParams.recipient,
        collectModuleInitParams.referralFee,
        collectModuleInitParams.followerOnly,
      ]
    );

    const postData: PostData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FeeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.FeeCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createFreeCollectPostWithSig({
    profileId,
    contentURI,
    collectModuleInitParams,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    collectModuleInitParams: {
      followerOnly: boolean;
    };
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [collectModuleInitParams.followerOnly]
    );

    const nonce = await this.getSigNonce();

    const sig = await this._getPostWithSigPartsByWallet({
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FreeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const postWithSigData: PostWithSigData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FreeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
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

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.FreeCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createRevertCollectPostWithSig({
    profileId,
    contentURI,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const nonce = await this.getSigNonce();

    const sig = await this._getPostWithSigPartsByWallet({
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.RevertCollectModule,
      collectModuleInitData: [],
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const postWithSigData: PostWithSigData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.RevertCollectModule,
      collectModuleInitData: [],
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
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

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.RevertCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async createFeeCollectPostWithSig({
    profileId,
    contentURI,
    collectModuleInitParams,
    referenceModule,
    referenceModuleInitData,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    collectModuleInitParams: {
      amount: BigNumberish;
      currency: string;
      recipient: string;
      referralFee: BigNumberish;
      followerOnly: boolean;
    };
    referenceModule?: string;
    referenceModuleInitData?: any[];
  }) {
    await this.checker.checkCapability();

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [
        collectModuleInitParams.amount,
        collectModuleInitParams.currency,
        collectModuleInitParams.recipient,
        collectModuleInitParams.referralFee,
        collectModuleInitParams.followerOnly,
      ]
    );

    const nonce = await this.getSigNonce();

    const sig = await this._getPostWithSigPartsByWallet({
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FeeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const postWithSigData: PostWithSigData = {
      profileId,
      contentURI,
      collectModule: this.lensContractsAddress.FeeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
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

    try {
      await this._persistPublication({
        pubType: "post",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        contentURI,
        collectModule: this.lensContractsAddress.FeeCollectModule,
        referenceModule: referenceModule || ethers.constants.AddressZero,
      });
    } catch (e) {
      console.warn(e);
    }

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
