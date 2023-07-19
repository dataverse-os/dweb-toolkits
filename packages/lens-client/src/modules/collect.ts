import { FileType, CoreConnector, Methods } from "@dataverse/core-connector";
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
    coreConnector,
    network,
  }: {
    modelIds: ModelIds;
    coreConnector: CoreConnector;
    network: LensNetwork;
  }) {
    super({
      modelIds,
      coreConnector,
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

    const collectNFT = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: this.lensContractsAddress.LensHubProxy,
        abi: LensHubJson.abi,
        method: "getCollectNFT",
        params: [profileId, pubId],
      },
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

    const collectModule = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: this.lensContractsAddress.LensHubProxy,
        abi: LensHubJson.abi,
        method: "getCollectModule",
        params: [profileId, pubId],
      },
    });

    return collectModule as string;
  }

  public async isCollectModuleWhitelisted(collectModule: string) {
    this.checker.checkWallet();

    const isWhitelisted = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: this.lensContractsAddress.LensHubProxy,
        abi: LensHubJson.abi,
        method: "isCollectModuleWhitelisted",
        params: [collectModule],
      },
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

    const balance = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: collectNFT,
        abi: CollectNFTJson.abi,
        method: "balanceOf",
        params: [collector],
      },
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

    const { modelId, streamContent } = await this.coreConnector.runOS({
      method: Methods.loadStream,
      params: streamId,
    });
    if (modelId != this.modelIds[ModelType.Publication]) {
      throw new Error("stream id not available to collect");
    }

    const profileId = streamContent.content.profile_id;
    const pubId = streamContent.content.pub_id;
    const pointedStreamId = streamContent.content.content_uri;

    const { streamContent: pointedStreamContent } =
      await this.coreConnector.runOS({
        method: Methods.loadStream,
        params: pointedStreamId,
      });

    if (pointedStreamContent.file.fileType !== FileType.Datatoken) {
      throw new Error("stream id pointed not available to collect");
    }

    const datatokenId = pointedStreamContent.file.datatokenId!;

    const isCollected = await this.coreConnector.runOS({
      method: Methods.isCollected,
      params: {
        datatokenId,
        address: this.coreConnector.address!,
      },
    });

    let persistRes;
    if (!isCollected) {
      let res: EventCollected;
      if (!withSig) {
        res = await this._collect({
          profileId,
          pubId,
        });
      } else {
        res = await this._collectWithSig({
          profileId,
          pubId,
        });
      }

      const datatokenInfo = await this.coreConnector.runOS({
        method: Methods.getDatatokenBaseInfo,
        params: datatokenId,
      });

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

    const { streamContent: unlockedStreamContent } =
      await this.coreConnector.runOS({
        method: Methods.unlock,
        params: {
          streamId: streamContent.content.content_uri
        },
      });

    return {
      collectionStreamId: persistRes?.streamId,
      unlockedStreamContent,
    };
  }

  private async _collect({
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
        owner: this.coreConnector.address!,
        spender: collectModule,
        amount: publicationData.amount,
      });
    }

    const res = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: this.lensContractsAddress.LensHubProxy,
        abi: LensHubJson.abi,
        method: "collect",
        params: [profileId, pubId, collectModuleValidateData],
      },
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COLLECTED;
    });

    return {
      collector: (targetEvent as any).topics[1],
      profileId: (targetEvent as any).topics[2],
      pubId: (targetEvent as any).topics[3],
    } as EventCollected;
  }

  private async _collectWithSig({
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
        owner: this.coreConnector.address!,
        spender: collectModule,
        amount: publicationData.amount,
      });
    }

    const collector = this.coreConnector.address!;
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
      wallet: this.coreConnector.getProvider(),
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.coreConnector.chain!.chainId,
    });

    const res = await this.coreConnector.runOS({
      method: Methods.contractCall,
      params: {
        contractAddress: this.lensContractsAddress.LensHubProxy,
        abi: LensHubJson.abi,
        method: "collectWithSig",
        params: [collectWithSigData as CollectWithSigData],
      },
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_COLLECTED;
    });

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

        publicationData = await this.coreConnector.runOS({
          method: Methods.contractCall,
          params: {
            contractAddress: collectModule,
            abi: FeeCollectModuleJson.abi,
            method: "getPublicationData",
            params: [profileId, pubId],
          },
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.LimitedFeeCollectModule: {
        console.log("[LimitedFeeCollectModule]");

        publicationData = await this.coreConnector.runOS({
          method: Methods.contractCall,
          params: {
            contractAddress: collectModule,
            abi: LimitedFeeCollectModuleJson.abi,
            method: "getPublicationData",
            params: [profileId, pubId],
          },
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.TimedFeeCollectModule: {
        console.log("[TimedFeeCollectModule]");

        publicationData = await this.coreConnector.runOS({
          method: Methods.contractCall,
          params: {
            contractAddress: collectModule,
            abi: TimedFeeCollectModuleJson.abi,
            method: "getPublicationData",
            params: [profileId, pubId],
          },
        });

        collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [publicationData.currency, publicationData.amount]
        );
        break;
      }

      case this.lensContractsAddress.LimitedTimedFeeCollectModule: {
        console.log("[LimitedTimedFeeCollectModule]");

        publicationData = await this.coreConnector.runOS({
          method: Methods.contractCall,
          params: {
            contractAddress: collectModule,
            abi: LimitedTimedFeeCollectModuleJson.abi,
            method: "getPublicationData",
            params: [profileId, pubId],
          },
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
    return await this.coreConnector.runOS({
      method: Methods.createStream,
      params: {
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
      },
    });
  }
}
