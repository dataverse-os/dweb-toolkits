import {
  Mode,
  // DatatokenVars,
  RuntimeConnector,
  // StreamContent,
} from "@dataverse/runtime-connector";
import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  EVENT_SIG_COLLECTED,
  EVENT_SIG_POST_CREATED,
  EVENT_SIG_PROFILE_CREATED,
  MUMBAI_CONTRACTS_ADDRESS,
  POLYGON_CONTRACTS_ADDRESS,
  SANDBOX_MUMBAI_CONTRACTS_ADDRESS,
} from "./constants";
import {
  CreateProfileData,
  EventCollected,
  EventPostCreated,
  EventProfileCreated,
  LensNetwork,
  PostData,
  ProfileStruct,
} from "./types";
import { request, gql } from "graphql-request";
import LensHubJson from "../contracts/LensHub.json";
import CollectNFTJson from "../contracts/CollectNFT.json";
import FeeCollectModuleJson from "../contracts/modules/collect/FeeCollectModule.json";
import LimitedFeeCollectModuleJson from "../contracts/modules/collect/LimitedFeeCollectModule.json";
import LimitedTimedFeeCollectModuleJson from "../contracts/modules/collect/LimitedTimedFeeCollectModule.json";
import TimedFeeCollectModuleJson from "../contracts/modules/collect/TimedFeeCollectModule.json";
import ProfileCreationProxyJson from "../contracts/ProfileCreationProxy.json";

// import { StreamHelper } from "@dataverse/utils-toolkit";

export class LensClient {
  public network: LensNetwork;
  public lensContractsAddress!: any;
  public lensApiLink!: string;
  public runtimeConnector: RuntimeConnector;

  constructor({
    runtimeConnector,
    network,
  }: {
    runtimeConnector: RuntimeConnector;
    network: LensNetwork;
  }) {
    this.runtimeConnector = runtimeConnector;
    this.network = network;
    this._initLensContractsAddress(network);
    this._initLensApiLink(network);
  }

  public async isProfileCreatorWhitelisted(profileCreator: string) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "isProfileCreatorWhitelisted",
      params: [profileCreator],
      mode: Mode.Read,
    });

    return res;
  }

  public async createProfile({
    to,
    handle,
    imageURI,
    followModule,
    followModuleInitData,
    followNFTURI,
  }: {
    to: string;
    handle: string;
    imageURI: string;
    followModule?: string;
    followModuleInitData?: any[];
    followNFTURI?: string;
  }) {
    const createProfileData: CreateProfileData = {
      to,
      handle,
      imageURI,
      followModule: followModule || ethers.constants.AddressZero,
      followModuleInitData: followModuleInitData || [],
      followNFTURI: followNFTURI || "https://github.com/dataverse-os",
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress:
        this.network === LensNetwork.PloygonMainnet
          ? this.lensContractsAddress.ProfileCreationProxy
          : this.lensContractsAddress.MockProfileCreationProxy,
      abi: ProfileCreationProxyJson.abi,
      method: "proxyCreateProfile",
      params: [createProfileData],
      mode: Mode.Write,
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_PROFILE_CREATED;
    });

    return {
      profileId: (targetEvent as any).topics[1],
      creator: (targetEvent as any).topics[2],
      to: (targetEvent as any).topics[3],
    } as EventProfileCreated;
  }

  public async setDefaultProfile(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setDefaultProfile",
      params: [profileId],
      mode: Mode.Write,
    });
    return res;
  }

  public async getProfiles(address: string) {
    const document = gql`
      query ProfileQuery($request: ProfileQueryRequest!) {
        profiles(request: $request) {
          items {
            id
          }
        }
      }
    `;
    const result = (await request(this.lensApiLink, document, {
      request: {
        ownedBy: address,
      },
    })) as any;
    return result.profiles.items;
  }

  public async getProfile(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfile",
      params: [profileId],
      mode: Mode.Read,
    });
    return res as ProfileStruct;
  }

  public async getProfileIdByHandle(handle: string) {
    const profileId = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfileIdByHandle",
      params: [handle],
      mode: Mode.Read,
    });
    return profileId;
  }

  public async setRevertFollowModule(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, this.lensContractsAddress.RevertFollowModule, []],
      mode: Mode.Write,
    });
    return res;
  }

  public async setFeeFollowModule({
    profileId,
    moduleInitParams,
  }: {
    profileId: BigNumberish;
    moduleInitParams: {
      amount: BigNumberish;
      currency: string;
      recipient: string;
    };
  }) {
    const moduleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address"],
      [
        moduleInitParams.amount,
        moduleInitParams.currency,
        moduleInitParams.recipient,
      ]
    );

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [
        profileId,
        this.lensContractsAddress.FeeFollowModule,
        moduleInitData,
      ],
      mode: Mode.Write,
    });

    return res;
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
      mode: Mode.Write,
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

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
      mode: Mode.Write,
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

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
      mode: Mode.Write,
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_POST_CREATED;
    });

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventPostCreated;
  }

  public async getCollectModule({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    const collectModule = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getCollectModule",
      params: [profileId, pubId],
      mode: Mode.Read,
    });

    console.log("collectModule:", collectModule);

    return collectModule as string;
  }

  public async collect({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    const collectModule = await this.getCollectModule({ profileId, pubId });

    const { collectModuleValidateData, publicationData } =
      await this._getCollectValidateData({
        profileId,
        pubId,
        collectModule,
      });
    console.log("collectModuleValidateData:", collectModuleValidateData);
    console.log("publicationData:", publicationData);

    if (publicationData) {
      await this._approveERC20({
        contract: publicationData.currency,
        spender: collectModule,
        amount: publicationData.amount,
      });
    }

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "collect",
      params: [profileId, pubId, collectModuleValidateData],
      mode: Mode.Write,
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

  public async getCollectNFT({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    const collectNFT = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getCollectNFT",
      params: [profileId, pubId],
      mode: Mode.Read,
    });

    return collectNFT;
  }

  public async isCollected({
    collectNFT,
    collector,
  }: {
    collectNFT: string;
    collector: string;
  }) {
    const balance = await this.runtimeConnector.contractCall({
      contractAddress: collectNFT,
      abi: CollectNFTJson.abi,
      method: "balanceOf",
      params: [collector],
      mode: Mode.Read,
    });

    return BigNumber.from(balance).gt(0);
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
          mode: Mode.Read,
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
          mode: Mode.Read,
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
          mode: Mode.Read,
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
          mode: Mode.Read,
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

  private async _approveERC20({
    contract,
    spender,
    amount,
  }: {
    contract: string;
    spender: string;
    amount: BigNumberish;
  }) {
    await this.runtimeConnector.contractCall({
      contractAddress: contract,
      abi: [
        {
          constant: false,
          inputs: [
            {
              name: "_spender",
              type: "address",
            },
            {
              name: "_value",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [
            {
              name: "",
              type: "bool",
            },
          ],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      method: "approve",
      params: [spender, amount],
      mode: Mode.Write,
    });
  }

  private _initLensContractsAddress(network: LensNetwork) {
    switch (network) {
      case LensNetwork.PloygonMainnet: {
        this.lensContractsAddress = POLYGON_CONTRACTS_ADDRESS;
        break;
      }
      case LensNetwork.MumbaiTestnet: {
        this.lensContractsAddress = MUMBAI_CONTRACTS_ADDRESS;
        break;
      }
      case LensNetwork.SandboxMumbaiTestnet: {
        this.lensContractsAddress = SANDBOX_MUMBAI_CONTRACTS_ADDRESS;
        break;
      }
    }
  }

  private _initLensApiLink(network: LensNetwork) {
    switch (network) {
      case LensNetwork.PloygonMainnet: {
        this.lensApiLink = "https://api.lens.dev";
        break;
      }
      case LensNetwork.MumbaiTestnet: {
        this.lensApiLink = "https://api-mumbai.lens.dev";
        break;
      }
      case LensNetwork.SandboxMumbaiTestnet: {
        this.lensApiLink = "https://api-sandbox-mumbai.lens.dev";
        break;
      }
    }
  }
}
