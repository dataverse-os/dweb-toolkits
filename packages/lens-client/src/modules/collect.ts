import { FileType, RuntimeConnector } from "@dataverse/runtime-connector";
import { BigNumber, BigNumberish, ethers, Wallet } from "ethers";
import { EVENT_SIG_COLLECTED, MAX_UINT256 } from "../constants";
import {
  CollectWithSigData,
  EIP712Signature,
  EventCollected,
  LensNetwork,
  ModelIds,
  ModelType,
} from "../types";
import LensHubJson from "../../contracts/LensHub.json";
import CollectNFTJson from "../../contracts/CollectNFT.json";
import FeeCollectModuleJson from "../../contracts/modules/collect/FeeCollectModule.json";
import LimitedFeeCollectModuleJson from "../../contracts/modules/collect/LimitedFeeCollectModule.json";
import LimitedTimedFeeCollectModuleJson from "../../contracts/modules/collect/LimitedTimedFeeCollectModule.json";
import TimedFeeCollectModuleJson from "../../contracts/modules/collect/TimedFeeCollectModule.json";
import { ClientBase } from "./base";

export class Collect extends ClientBase {
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

  public async getCollectNFT({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    this.checker.checkWallet();

    const collectNFT = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getCollectNFT",
      params: [profileId, pubId],
    });

    return collectNFT;
  }

  public async getCollectModule({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    this.checker.checkWallet();

    const collectModule = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getCollectModule",
      params: [profileId, pubId],
    });

    return collectModule as string;
  }

  public async isCollectModuleWhitelisted(collectModule: string) {
    this.checker.checkWallet();

    const isWhitelisted = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "isCollectModuleWhitelisted",
      params: [collectModule],
    });

    return isWhitelisted;
  }

  public async isCollected({
    collectNFT,
    collector,
  }: {
    collectNFT: string;
    collector: string;
  }) {
    this.checker.checkWallet();

    const balance = await this.runtimeConnector.contractCall({
      contractAddress: collectNFT,
      abi: CollectNFTJson.abi,
      method: "balanceOf",
      params: [collector],
    });

    return BigNumber.from(balance).gt(0);
  }

  public async collectOnCeramic({
    streamId,
    withSig = false,
  }: {
    streamId: string;
    withSig?: boolean;
  }) {
    await this.checker.checkCapability();
    const { modelId, streamContent } = await this.runtimeConnector.loadStream(
      streamId
    );
    if (modelId != this.modelIds[ModelType.Publication]) {
      throw new Error("stream id not available to collect");
    }
    console.log("loaded, streamContent:", streamContent)
    const profileId = streamContent.content.profile_id;
    const pubId = streamContent.content.pub_id;
    const pointedStreamId = streamContent.content.content_uri;

    const {streamContent: pointedStreamContent} = await this.runtimeConnector.loadStream(
      pointedStreamId
    );
    console.log("pointedStreamContent:", pointedStreamContent)
    if(pointedStreamContent.file.fileType !== FileType.Datatoken) {
      throw new Error("stream id pointed not available to collect");
    }

    const datatokenId = pointedStreamContent.file.datatokenId!;

    const isCollected = await this.runtimeConnector.isCollected({
      datatokenId,
      address: this.runtimeConnector.address!
    })

    console.log("isCollected:", isCollected)

    // const collectNFT = await this.getCollectNFT({ profileId, pubId });
    // const isCollected =
    //   collectNFT === ethers.constants.AddressZero
    //     ? false
    //     : await this.isCollected({
    //         collectNFT,
    //         collector: this.runtimeConnector.address!,
    //       });

    let persistRes;
    if (!isCollected) {
      let res: EventCollected;
      if (!withSig) {
        res = await this.collect({
          profileId,
          pubId,
        });
      } else {
        res = await this.collectWithSig({
          profileId,
          pubId,
        });
      }

      const datatokenInfo = await this.runtimeConnector.getDatatokenBaseInfo(
        datatokenId
      );

      try {
        persistRes = await this._persistCollection({
          profileId: res.profileId,
          pubId: res.pubId,
          modelId: streamContent.content.model_id,
          streamId: streamContent.content.content_uri,
          collector: res.collector,
          currency: (datatokenInfo as any).collect_info.price.currency_addr,
          amount: `${(datatokenInfo as any).collect_info.price.amount} ${
            (datatokenInfo as any).collect_info.price.currency
          }`,
          collectLimit: (datatokenInfo as any).collect_info.total,
        });
      } catch (e) {
        console.warn(e);
      }
    }

    console.log("collected");

    const { streamContent: unlockedStreamContent } =
    await this.runtimeConnector.unlock({
      streamId: streamContent.content.content_uri,
    });

    console.log("unlocked")

    return {
      collectionStreamId: persistRes?.streamId,
      unlockedStreamContent,
    };
  }

  public async collect({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    await this.checker.checkCapability();

    const collectModule = await this.getCollectModule({ profileId, pubId });

    const { collectModuleValidateData, publicationData } =
      await this._getCollectValidateData({
        profileId,
        pubId,
        collectModule,
      });

    if (publicationData) {
      await this._approveERC20({
        contract: publicationData.currency,
        owner: this.runtimeConnector.address!,
        spender: collectModule,
        amount: publicationData.amount,
      });
    }

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "collect",
      params: [profileId, pubId, collectModuleValidateData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COLLECTED;
    });

    // try {
    //   await this._persistCollection({
    //     profileId,
    //     pubId,
    //   });
    // } catch (e) {
    //   console.warn(e);
    // }

    return {
      collector: (targetEvent as any).topics[1],
      profileId: (targetEvent as any).topics[2],
      pubId: (targetEvent as any).topics[3],
    } as EventCollected;
  }

  public async collectWithSig({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    await this.checker.checkCapability();

    const collectModule = await this.getCollectModule({ profileId, pubId });

    const { collectModuleValidateData, publicationData } =
      await this._getCollectValidateData({
        profileId,
        pubId,
        collectModule,
      });

    if (publicationData) {
      await this._approveERC20({
        contract: publicationData.currency,
        owner: this.runtimeConnector.address!,
        spender: collectModule,
        amount: publicationData.amount,
      });
    }

    const collector = this.runtimeConnector.address!;
    const collectWithSigData: Partial<CollectWithSigData> = {
      collector: collector,
      profileId: profileId,
      pubId: pubId,
      data: collectModuleValidateData,
    };

    const nonce = await this.getSigNonce();

    collectWithSigData.sig = await this._getCollectWithSigPartsByWallet({
      profileId,
      pubId,
      data: collectModuleValidateData,
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "collectWithSig",
      params: [collectWithSigData as CollectWithSigData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COLLECTED;
    });

    // try {
    //   await this._persistCollection({
    //     profileId,
    //     pubId,
    //   });
    // } catch (e) {
    //   console.warn(e);
    // }

    return {
      collector: (targetEvent as any).topics[1],
      profileId: (targetEvent as any).topics[2],
      pubId: (targetEvent as any).topics[3],
    } as EventCollected;
  }

  private async _getCollectValidateData({
    profileId,
    pubId,
    collectModule,
  }: {
    profileId: string;
    pubId: string;
    collectModule: string;
  }) {
    let collectModuleValidateData;
    let publicationData;
    switch (collectModule) {
      case this.lensContractsAddress.FeeCollectModule: {
        console.log("[FeeCollectModule]");

        publicationData = await this.runtimeConnector.contractCall({
          contractAddress: collectModule,
          abi: FeeCollectModuleJson.abi,
          method: "getPublicationData",
          params: [profileId, pubId],
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.LimitedFeeCollectModule: {
        console.log("[LimitedFeeCollectModule]");

        publicationData = await this.runtimeConnector.contractCall({
          contractAddress: collectModule,
          abi: LimitedFeeCollectModuleJson.abi,
          method: "getPublicationData",
          params: [profileId, pubId],
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.TimedFeeCollectModule: {
        console.log("[TimedFeeCollectModule]");

        publicationData = await this.runtimeConnector.contractCall({
          contractAddress: collectModule,
          abi: TimedFeeCollectModuleJson.abi,
          method: "getPublicationData",
          params: [profileId, pubId],
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.LimitedTimedFeeCollectModule: {
        console.log("[LimitedTimedFeeCollectModule]");

        publicationData = await this.runtimeConnector.contractCall({
          contractAddress: collectModule,
          abi: LimitedTimedFeeCollectModuleJson.abi,
          method: "getPublicationData",
          params: [profileId, pubId],
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      default: {
        console.log("[Default]");

        collectModuleValidateData = [];
        break;
      }
    }

    return {
      collectModuleValidateData,
      publicationData,
    };
  }

  private async _getCollectWithSigPartsByWallet({
    profileId,
    pubId,
    data,
    nonce,
    deadline,
    wallet,
    lensHubAddr,
    chainId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
    data: any[];
    nonce: number;
    deadline: string;
    wallet: Wallet;
    lensHubAddr: string;
    chainId: number;
  }): Promise<EIP712Signature> {
    const msgParams = {
      types: {
        CollectWithSig: [
          { name: "profileId", type: "uint256" },
          { name: "pubId", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      domain: this._domain(lensHubAddr, chainId),
      value: {
        profileId,
        pubId,
        data,
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

  private async _persistCollection({
    profileId,
    pubId,
    modelId,
    streamId,
    collector,
    currency,
    amount,
    collectLimit,
  }: {
    profileId: string;
    pubId: string;
    modelId: string;
    streamId: string;
    collector: string;
    currency: string;
    amount: BigNumberish;
    collectLimit: BigNumberish;
  }) {
    const collectNFT = await this.getCollectNFT({
      profileId,
      pubId,
    });
    return await this.runtimeConnector.createStream({
      modelId: this.modelIds[ModelType.Collection],
      streamContent: {
        profile_id: profileId,
        pub_id: pubId,
        model_id: modelId,
        stream_id: streamId,
        collector,
        currency,
        amount,
        collect_limit: collectLimit,
        collect_nft: collectNFT,
        collected_at: Date.now(),
      },
    });
  }
}
