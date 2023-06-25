import {
  Mode,
  // DatatokenVars,
  RuntimeConnector,
  // StreamContent,
} from "@dataverse/runtime-connector";
import {BigNumber, BigNumberish, Bytes, ethers, Wallet} from "ethers";
import {
  EVENT_SIG_COLLECTED,
  EVENT_SIG_POST_CREATED,
  LENS_CONTRACTS_ADDRESS, LENS_HUB_NFT_NAME, MAX_UINT256, ZERO_ADDRESS,
} from "./constants";
import {
  CreateProfileData,
  EventCollected,
  EventPostCreated,
  PostData, PostWithSigData,
  ProfileStruct, Sig,
} from "./types";
import { request, gql } from "graphql-request";
import LensHubJson from "../contracts/LensHub.sol/LensHub.json";
import CollectNFTJson from "../contracts/CollectNFT.sol/CollectNFT.json";
import FeeCollectModuleJson from "../contracts/modules/collect/FeeCollectModule.sol/FeeCollectModule.json";
import LimitedFeeCollectModuleJson from "../contracts/modules/collect/LimitedFeeCollectModule.sol/LimitedFeeCollectModule.json";
import LimitedTimedFeeCollectModuleJson from "../contracts/modules/collect/LimitedTimedFeeCollectModule.sol/LimitedTimedFeeCollectModule.json";
import TimedFeeCollectModuleJson from "../contracts/modules/collect/TimedFeeCollectModule.sol/TimedFeeCollectModule.json";
import {RuntimeConnectorSigner} from "@dataverse/utils-toolkit";

// import { StreamHelper } from "@dataverse/utils-toolkit";

export class LensClient {
  public runtimeConnector: RuntimeConnector;
  public signer: RuntimeConnectorSigner;

  constructor({runtimeConnector}: { runtimeConnector: RuntimeConnector }) {
    this.runtimeConnector = runtimeConnector;
    this.signer = new RuntimeConnectorSigner(runtimeConnector);
  }

  public async isProfileCreatorWhitelisted(profileCreator: string) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "isProfileCreatorWhitelisted",
      params: [profileCreator],
      mode: Mode.Read,
    });

    return res;
  }

  /**
   * @notice only whitelisted profile creator
   */
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
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "createProfile",
      params: [createProfileData],
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
    const result = (await request("https://api-mumbai.lens.dev", document, {
      request: {
        ownedBy: address,
      },
    })) as any;
    return result.profiles.items;
  }

  public async getProfile(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfile",
      params: [profileId],
      mode: Mode.Read,
    });
    return res as ProfileStruct;
  }

  public async getProfileIdByHandle(handle: string) {
    const profileId = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfileIdByHandle",
      params: [handle],
      mode: Mode.Read,
    });
    return profileId;
  }

  public async setRevertFollowModule(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, LENS_CONTRACTS_ADDRESS.RevertFollowModule, []],
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
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [
        profileId,
        LENS_CONTRACTS_ADDRESS.FeeFollowModule,
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
      collectModule: LENS_CONTRACTS_ADDRESS.FreeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
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
      collectModule: LENS_CONTRACTS_ADDRESS.RevertCollectModule,
      collectModuleInitData: [],
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
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
      collectModule: LENS_CONTRACTS_ADDRESS.FeeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
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

    const postWithSigData: Partial<PostWithSigData> = {
      profileId,
      contentURI,
      collectModule: LENS_CONTRACTS_ADDRESS.FeeCollectModule,
      collectModuleInitData,
      referenceModule: referenceModule || ethers.constants.AddressZero,
      referenceModuleInitData: referenceModuleInitData || [],
    };

    const nonce = await this.getSigNonce();
    console.log("Signer addr: ", await this.signer.getAddress());

    const {chain} = await this.runtimeConnector.connectWallet();

    const sig = await this._getSigCommon(
      profileId,
      contentURI,
      LENS_CONTRACTS_ADDRESS.FeeCollectModule,
      // @ts-ignore
      collectModuleInitData,
      ZERO_ADDRESS,
      [],
      nonce,
      MAX_UINT256,
      this.signer as Wallet,
      LENS_CONTRACTS_ADDRESS.lensHubProxy,
      chain.chainId
    );

    postWithSigData.sig = sig;

    console.log("PostWithSigData: ", postWithSigData);

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "postWithSig",
      // params: [[profileId, contentURI, LENS_CONTRACTS_ADDRESS.FeeCollectModule, collectModuleInitData, referenceModule, referenceModuleInitData, [sig.v, sig.r , sig.s, MAX_UINT256]]],
      params: [postWithSigData as PostWithSigData],
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
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "getCollectModule",
      params: [profileId, pubId],
      mode: Mode.Read,
    });

    console.log("collectModule:", collectModule);

    return collectModule as string;
  }

  public async getSigNonce() {
    const address = await this.signer.getAddress();
    console.log("address: ", address);

    const nonce = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "sigNonces",
      params: [address],
      mode: Mode.Read,
    });

    console.log("user sig nonce: :", nonce);
    return nonce;
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
     await this._approveERC20(
      {
        contract: publicationData.currency,
        spender: collectModule,
        amount: publicationData.amount
      }
     )
    }

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
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
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
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

  // async postWithSig(signer: Signer, vars: PostInput): Promise<any> {
  //   let output: Partial<CreateLensPostOutput> = {};
  //   let pVars: Partial<PostWithSigDataStruct> = {};
  //   pVars = await this._generatePostVars(signer, vars);
  //   const lensHub = await getLensHub(this.config.lensHub, signer)
  //   await lensHub.postWithSig(pVars).then(async (tx: any) => {
  //     const r = await tx.wait();
  //     output.txhash = r.transactionHash;
  //     console.log("txHash: ", r.transactionHash);
  //     r.events.forEach((e: any) => {
  //       if (e.event === 'PostCreated') {
  //         console.log(`event : PostCreated
  //                           profileId                :   ${e.args.profileId}
  //                           pubId                    :   ${e.args.pubId}
  //                           contentURI               :   ${e.args.contentURI}
  //                           collectModule            :   ${e.args.collectModule}
  //                           collectModuleReturnData  :   ${e.args.collectModuleReturnData}
  //                           referenceModule          :   ${e.args.referenceModule}
  //                           referenceModuleReturnData:   ${e.args.referenceModuleReturnData}
  //                           timestamp                :   ${e.args.timestamp}
  //                   `);
  //         output.profileId = e.args.profileId;
  //         output.pubId = e.args.pubId;
  //         output.contentURI = e.args.contentURI;
  //         output.collectModule = e.args.collectModule;
  //         output.collectModuleReturnData = e.args.collectModuleReturnData;
  //         output.referenceModule = e.args.referenceModule;
  //         output.referenceModuleReturnData = e.args.referenceModuleReturnData;
  //         output.timestamp = e.args.timestamp;
  //       }
  //     })
  //   });
  //   return output;
  // }
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
      case LENS_CONTRACTS_ADDRESS.FeeCollectModule: {
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

      case LENS_CONTRACTS_ADDRESS.LimitedFeeCollectModule: {
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

      case LENS_CONTRACTS_ADDRESS.TimedFeeCollectModule: {
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

      case LENS_CONTRACTS_ADDRESS.LimitedTimedFeeCollectModule: {
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
    amount
  }: {
    contract: string;
    spender: string;
    amount: BigNumberish
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

  private _buildPostWithSigParams = (
    profileId: BigNumberish,
    contentURI: string,
    collectModule: string,
    collectModuleInitData: Bytes | string,
    referenceModule: string,
    referenceModuleInitData: Bytes | string,
    nonce: number,
    deadline: string,
    lensHubAddr: string,
    chainId: number
  ) => ({
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
      profileId: profileId,
      contentURI: contentURI,
      collectModule: collectModule,
      collectModuleInitData: collectModuleInitData,
      referenceModule: referenceModule,
      referenceModuleInitData: referenceModuleInitData,
      nonce: nonce,
      deadline: deadline,
    },
  });
  private _domain(lensHubAddr: string, chainId: number): {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  } {
    return {
      name: LENS_HUB_NFT_NAME,
      version: "1",
      chainId: chainId,
      verifyingContract: lensHubAddr,
    };
  }


  private async _getSigByWallet(
    wallet: Wallet,
    msgParams: {
      domain: any;
      types: any;
      value: any;
    }
  ): Promise<{ v: number; r: string; s: string }> {
    const sig = await wallet._signTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.value
    );
    return ethers.utils.splitSignature(sig);
  }

  private async _getSigCommon(
    profileId: BigNumber | number,
    contentURI: string,
    collectModuleAddr: string,
    collectModuleInitData: string | any[],
    referenceModule: string,
    referenceModuleInitData: string | any[],
    nonce: number,
    deadline: string,
    wallet: Wallet,
    lensHubAddr: string,
    chainId: number
  ) {
    console.log("sigCommon: ", {
      profileId,
      contentURI,
      collectModuleAddr,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData,
      nonce,
      deadline,
      wallet,
      lensHubAddr,
      chainId
    })
    const {v, r, s} = await this._getPostWithSigPartsByWallet(
      profileId,
      contentURI,
      collectModuleAddr,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData,
      nonce,
      deadline,
      wallet,
      lensHubAddr,
      chainId
    );

    const sig: Sig = {
      v: v,
      s: s,
      r: r,
      deadline: deadline,
    };

    return sig;
  }

  private async _getPostWithSigPartsByWallet(
    profileId: BigNumberish,
    contentURI: string,
    collectModule: string,
    collectModuleInitData: Bytes | string,
    referenceModule: string,
    referenceModuleInitData: Bytes | string,
    nonce: number,
    deadline: string,
    wallet: Wallet,
    lensHubAddr: string,
    chainId: number
  ): Promise<{ v: number; r: string; s: string }> {
    const msgParams = this._buildPostWithSigParams(
      profileId,
      contentURI,
      collectModule,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData,
      nonce,
      deadline,
      lensHubAddr,
      chainId
    );
    return await this._getSigByWallet(wallet, msgParams);
  }
}
