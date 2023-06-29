import { RuntimeConnector } from "@dataverse/runtime-connector";
import { Profile, Follow, Post, Comment, Collect, Mirror } from "./modules";
import { ClientBase } from "./modules/base";
import { LensNetwork, ModelIds, ModelType } from "./types";
import { applyMixins } from "./utils";

class LensClient extends ClientBase {
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

  public async getPersistedPublications() {
    await this.checker.checkCapability();

    const pkh = await this.runtimeConnector.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelIds[ModelType.Publication],
      pkh,
    });
    return streams;
  }

  public async getPersistedCollections() {
    await this.checker.checkCapability();

    const pkh = await this.runtimeConnector.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelIds[ModelType.Collection],
      pkh,
    });
    return streams;
  }
}

interface LensClient extends Profile, Follow, Post, Comment, Collect, Mirror {}

applyMixins(LensClient, [Profile, Follow, Post, Comment, Collect, Mirror]);

export { LensClient };

// import { RuntimeConnector } from "@dataverse/runtime-connector";
// import { BigNumber, BigNumberish, ethers, Wallet } from "ethers";
// import {
//   EVENT_SIG_COLLECTED,
//   EVENT_SIG_POST_CREATED,
//   EVENT_SIG_PROFILE_CREATED,
//   MUMBAI_CONTRACTS_ADDRESS,
//   POLYGON_CONTRACTS_ADDRESS,
//   SANDBOX_MUMBAI_CONTRACTS_ADDRESS,
//   LENS_HUB_NFT_NAME,
//   MAX_UINT256,
//   EVENT_SIG_COMMENT_CREATED,
//   EVENT_SIG_MIRROR_CREATED,
//   EVENT_SIG_FOLLOWED,
// } from "./constants";
// import {
//   CollectWithSigData,
//   CommentData,
//   CommentWithSigData,
//   CreateProfileData,
//   EIP712Signature,
//   EventCollected,
//   EventCommentCreated,
//   EventFollowed,
//   EventMirrorCreated,
//   EventPostCreated,
//   EventProfileCreated,
//   FollowWithSigData,
//   LensNetwork,
//   MirrorData,
//   MirrorWithSigData,
//   ModelIds,
//   ModelType,
//   PostData,
//   PostWithSigData,
//   ProfileStruct,
// } from "./types";
// import { Checker } from "@dataverse/utils-toolkit";
// import { request, gql } from "graphql-request";
// import LensHubJson from "../contracts/LensHub.json";
// import CollectNFTJson from "../contracts/CollectNFT.json";
// import FollowNFTJson from "../contracts/FollowNFT.json";
// import FeeCollectModuleJson from "../contracts/modules/collect/FeeCollectModule.json";
// import LimitedFeeCollectModuleJson from "../contracts/modules/collect/LimitedFeeCollectModule.json";
// import LimitedTimedFeeCollectModuleJson from "../contracts/modules/collect/LimitedTimedFeeCollectModule.json";
// import TimedFeeCollectModuleJson from "../contracts/modules/collect/TimedFeeCollectModule.json";
// import ProfileCreationProxyJson from "../contracts/ProfileCreationProxy.json";
// import FeeFollowModuleJson from "../contracts/modules/follow/FeeFollowModule.json";

// export class LensClient extends Profile, Follow, Post, Comment, Collect, Mirror {

//   constructor({
//     modelIds,
//     runtimeConnector,
//     network,
//   }: {
//     modelIds: ModelIds;
//     runtimeConnector: RuntimeConnector;
//     network: LensNetwork;
//   }) {
//     super({
//       modelIds,
//       runtimeConnector,
//       network,
//     });
//   }

//   public async isProfileCreatorWhitelisted(profileCreator: string) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "isProfileCreatorWhitelisted",
//       params: [profileCreator],
//     });

//     return res;
//   }

//   public async createProfile({
//     to,
//     handle,
//     imageURI,
//     followModule,
//     followModuleInitData,
//     followNFTURI,
//   }: {
//     to: string;
//     handle: string;
//     imageURI: string;
//     followModule?: string;
//     followModuleInitData?: any[];
//     followNFTURI?: string;
//   }) {
//     this.checker.checkWallet();

//     const createProfileData: CreateProfileData = {
//       to,
//       handle,
//       imageURI,
//       followModule: followModule || ethers.constants.AddressZero,
//       followModuleInitData: followModuleInitData || [],
//       followNFTURI: followNFTURI || "https://github.com/dataverse-os",
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress:
//         this.network === LensNetwork.PloygonMainnet
//           ? this.lensContractsAddress.ProfileCreationProxy
//           : this.lensContractsAddress.MockProfileCreationProxy,
//       abi: ProfileCreationProxyJson.abi,
//       method: "proxyCreateProfile",
//       params: [createProfileData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_PROFILE_CREATED;
//     });

//     return {
//       profileId: (targetEvent as any).topics[1],
//       creator: (targetEvent as any).topics[2],
//       to: (targetEvent as any).topics[3],
//     } as EventProfileCreated;
//   }

//   public async burnProfile(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "burn",
//       params: [profileId],
//     });

//     return res;
//   }

//   public async setDefaultProfile(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "setDefaultProfile",
//       params: [profileId],
//     });
//     return res;
//   }

//   public async getProfiles(address: string) {
//     const document = gql`
//       query ProfileQuery($request: ProfileQueryRequest!) {
//         profiles(request: $request) {
//           items {
//             id
//           }
//         }
//       }
//     `;
//     const result = (await request(this.lensApiLink, document, {
//       request: {
//         ownedBy: address,
//       },
//     })) as any;
//     return result.profiles.items;
//   }

//   public async getProfile(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getProfile",
//       params: [profileId],
//     });
//     return res as ProfileStruct;
//   }

//   public async getProfileIdByHandle(handle: string) {
//     this.checker.checkWallet();

//     const profileId = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getProfileIdByHandle",
//       params: [handle],
//     });
//     return profileId;
//   }

//   public async setFollowModule({
//     profileId,
//     followModule,
//     followModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     followModule: string;
//     followModuleInitData: any[];
//   }) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "setFollowModule",
//       params: [profileId, followModule, followModuleInitData],
//     });
//     return res;
//   }

//   public async setRevertFollowModule(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "setFollowModule",
//       params: [profileId, this.lensContractsAddress.RevertFollowModule, []],
//     });
//     return res;
//   }

//   public async setFeeFollowModule({
//     profileId,
//     moduleInitParams,
//   }: {
//     profileId: BigNumberish;
//     moduleInitParams: {
//       amount: BigNumberish;
//       currency: string;
//       recipient: string;
//     };
//   }) {
//     this.checker.checkWallet();

//     const moduleInitData = ethers.utils.defaultAbiCoder.encode(
//       ["uint256", "address", "address"],
//       [
//         moduleInitParams.amount,
//         moduleInitParams.currency,
//         moduleInitParams.recipient,
//       ]
//     );

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "setFollowModule",
//       params: [
//         profileId,
//         this.lensContractsAddress.FeeFollowModule,
//         moduleInitData,
//       ],
//     });

//     return res;
//   }

//   public async follow(profileIds: string[]) {
//     this.checker.checkWallet();

//     const datas = await Promise.all(
//       profileIds.map(async (profileId) => {
//         const followModule = await this.getFollowModule(profileId);
//         const { followModuleValidateData, profileData } =
//           await this._getFollowValidateData({
//             profileId,
//             followModule,
//           });
//         if (profileData) {
//           await this._approveERC20({
//             contract: profileData.currency,
//             owner: this.runtimeConnector.address!,
//             spender: followModule,
//             amount: profileData.amount,
//           });
//         }
//         return followModuleValidateData;
//       })
//     );
//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "follow",
//       params: [profileIds, datas],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_FOLLOWED;
//     });

//     return {
//       follower: (targetEvent as any).topics[1],
//     } as EventFollowed;
//   }

//   public async followWithSig(profileIds: string[]) {
//     this.checker.checkWallet();

//     const datas = await Promise.all(
//       profileIds.map(async (profileId) => {
//         const followModule = await this.getFollowModule(profileId);
//         const { followModuleValidateData, profileData } =
//           await this._getFollowValidateData({
//             profileId,
//             followModule,
//           });
//         if (profileData) {
//           await this._approveERC20({
//             contract: profileData.currency,
//             owner: this.runtimeConnector.address!,
//             spender: followModule,
//             amount: profileData.amount,
//           });
//         }
//         return followModuleValidateData;
//       })
//     );

//     const nonce = await this.getSigNonce();
//     const sig = await this._getFollowWithSigPartsByWallet({
//       profileIds,
//       datas,
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const followWithSigData: FollowWithSigData = {
//       follower: this.runtimeConnector.address!,
//       profileIds,
//       datas,
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "followWithSig",
//       params: [followWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_FOLLOWED;
//     });

//     return {
//       follower: (targetEvent as any).topics[1],
//     } as EventFollowed;
//   }

//   public async getFollowNFT(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const followNFT = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getFollowNFT",
//       params: [profileId],
//     });

//     return followNFT;
//   }

//   public async isFollowed({
//     followNFT,
//     follower,
//   }: {
//     followNFT: string;
//     follower: string;
//   }) {
//     this.checker.checkWallet();

//     const balance = await this.runtimeConnector.contractCall({
//       contractAddress: followNFT,
//       abi: FollowNFTJson.abi,
//       method: "balanceOf",
//       params: [follower],
//     });

//     return BigNumber.from(balance).gt(0);
//   }

//   public async post(postData: PostData) {
//     await this.checker.checkCapability();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "post",
//       params: [postData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI: postData.contentURI,
//         collectModule: postData.collectModule,
//         referenceModule: postData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async postWithSig(postData: PostData) {
//     await this.checker.checkCapability();

//     const nonce = await this.getSigNonce();

//     const sig = await this._getPostWithSigPartsByWallet({
//       profileId: postData.profileId,
//       contentURI: postData.contentURI,
//       collectModule: postData.collectModule,
//       collectModuleInitData: postData.collectModuleInitData,
//       referenceModule: postData.referenceModule,
//       referenceModuleInitData: postData.referenceModuleInitData,
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const postWithSigData: PostWithSigData = {
//       ...postData,
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "postWithSig",
//       params: [postWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI: postData.contentURI,
//         collectModule: postData.collectModule,
//         referenceModule: postData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createFreeCollectPost({
//     profileId,
//     contentURI,
//     collectModuleInitParams,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     collectModuleInitParams: {
//       followerOnly: boolean;
//     };
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
//       ["bool"],
//       [collectModuleInitParams.followerOnly]
//     );

//     const postData: PostData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FreeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "post",
//       params: [postData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.FreeCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createRevertCollectPost({
//     profileId,
//     contentURI,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const postData: PostData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.RevertCollectModule,
//       collectModuleInitData: [],
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "post",
//       params: [postData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.RevertCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createFeeCollectPost({
//     profileId,
//     contentURI,
//     collectModuleInitParams,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     collectModuleInitParams: {
//       amount: BigNumberish;
//       currency: string;
//       recipient: string;
//       referralFee: BigNumberish;
//       followerOnly: boolean;
//     };
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
//       ["uint256", "address", "address", "uint16", "bool"],
//       [
//         collectModuleInitParams.amount,
//         collectModuleInitParams.currency,
//         collectModuleInitParams.recipient,
//         collectModuleInitParams.referralFee,
//         collectModuleInitParams.followerOnly,
//       ]
//     );

//     const postData: PostData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FeeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "post",
//       params: [postData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.FeeCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createFreeCollectPostWithSig({
//     profileId,
//     contentURI,
//     collectModuleInitParams,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     collectModuleInitParams: {
//       followerOnly: boolean;
//     };
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
//       ["bool"],
//       [collectModuleInitParams.followerOnly]
//     );

//     const nonce = await this.getSigNonce();

//     const sig = await this._getPostWithSigPartsByWallet({
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FreeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const postWithSigData: PostWithSigData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FreeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "postWithSig",
//       params: [postWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.FreeCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createRevertCollectPostWithSig({
//     profileId,
//     contentURI,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const nonce = await this.getSigNonce();

//     const sig = await this._getPostWithSigPartsByWallet({
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.RevertCollectModule,
//       collectModuleInitData: [],
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const postWithSigData: PostWithSigData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.RevertCollectModule,
//       collectModuleInitData: [],
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "postWithSig",
//       params: [postWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.RevertCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async createFeeCollectPostWithSig({
//     profileId,
//     contentURI,
//     collectModuleInitParams,
//     referenceModule,
//     referenceModuleInitData,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     collectModuleInitParams: {
//       amount: BigNumberish;
//       currency: string;
//       recipient: string;
//       referralFee: BigNumberish;
//       followerOnly: boolean;
//     };
//     referenceModule?: string;
//     referenceModuleInitData?: any[];
//   }) {
//     await this.checker.checkCapability();

//     const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
//       ["uint256", "address", "address", "uint16", "bool"],
//       [
//         collectModuleInitParams.amount,
//         collectModuleInitParams.currency,
//         collectModuleInitParams.recipient,
//         collectModuleInitParams.referralFee,
//         collectModuleInitParams.followerOnly,
//       ]
//     );

//     const nonce = await this.getSigNonce();

//     const sig = await this._getPostWithSigPartsByWallet({
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FeeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const postWithSigData: PostWithSigData = {
//       profileId,
//       contentURI,
//       collectModule: this.lensContractsAddress.FeeCollectModule,
//       collectModuleInitData,
//       referenceModule: referenceModule || ethers.constants.AddressZero,
//       referenceModuleInitData: referenceModuleInitData || [],
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "postWithSig",
//       params: [postWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_POST_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "post",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         contentURI,
//         collectModule: this.lensContractsAddress.FeeCollectModule,
//         referenceModule: referenceModule || ethers.constants.AddressZero,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventPostCreated;
//   }

//   public async getSigNonce() {
//     this.checker.checkWallet();

//     const address = this.runtimeConnector.address!;

//     const nonce = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "sigNonces",
//       params: [address],
//     });

//     return nonce;
//   }

//   public async collect({
//     profileId,
//     pubId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//   }) {
//     await this.checker.checkCapability();

//     const collectModule = await this.getCollectModule({ profileId, pubId });

//     const { collectModuleValidateData, publicationData } =
//       await this._getCollectValidateData({
//         profileId,
//         pubId,
//         collectModule,
//       });

//     if (publicationData) {
//       await this._approveERC20({
//         contract: publicationData.currency,
//         owner: this.runtimeConnector.address!,
//         spender: collectModule,
//         amount: publicationData.amount,
//       });
//     }

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "collect",
//       params: [profileId, pubId, collectModuleValidateData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_COLLECTED;
//     });

//     try {
//       await this._persistCollection({
//         profileId,
//         pubId,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       collector: (targetEvent as any).topics[1],
//       profileId: (targetEvent as any).topics[2],
//       pubId: (targetEvent as any).topics[3],
//     } as EventCollected;
//   }

//   public async collectWithSig({
//     profileId,
//     pubId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//   }) {
//     await this.checker.checkCapability();

//     const collectModule = await this.getCollectModule({ profileId, pubId });

//     const { collectModuleValidateData, publicationData } =
//       await this._getCollectValidateData({
//         profileId,
//         pubId,
//         collectModule,
//       });

//     if (publicationData) {
//       await this._approveERC20({
//         contract: publicationData.currency,
//         owner: this.runtimeConnector.address!,
//         spender: collectModule,
//         amount: publicationData.amount,
//       });
//     }

//     const collector = this.runtimeConnector.address!
//     const collectWithSigData: Partial<CollectWithSigData> = {
//       collector: collector,
//       profileId: profileId,
//       pubId: pubId,
//       data: collectModuleValidateData,
//     };

//     const nonce = await this.getSigNonce();

//     collectWithSigData.sig = await this._getCollectWithSigPartsByWallet({
//       profileId,
//       pubId,
//       data: collectModuleValidateData,
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "collectWithSig",
//       params: [collectWithSigData as CollectWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_COLLECTED;
//     });

//     try {
//       await this._persistCollection({
//         profileId,
//         pubId,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       collector: (targetEvent as any).topics[1],
//       profileId: (targetEvent as any).topics[2],
//       pubId: (targetEvent as any).topics[3],
//     } as EventCollected;
//   }

//   public async comment(commentData: CommentData) {
//     await this.checker.checkCapability();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "comment",
//       params: [commentData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_COMMENT_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "comment",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         profileIdPointed: commentData.profileIdPointed,
//         pubIdPointed: commentData.pubIdPointed,
//         contentURI: commentData.contentURI,
//         collectModule: commentData.collectModule,
//         referenceModule: commentData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventCommentCreated;
//   }

//   public async commentWithSig(commentData: CommentData) {
//     await this.checker.checkCapability();

//     const nonce = await this.getSigNonce();

//     const sig = await this._getCommentWithSigPartsByWallet({
//       profileId: commentData.profileId,
//       contentURI: commentData.contentURI,
//       profileIdPointed: commentData.profileIdPointed,
//       pubIdPointed: commentData.pubIdPointed,
//       referenceModuleData: commentData.referenceModuleData,
//       collectModule: commentData.collectModule,
//       collectModuleInitData: commentData.collectModuleInitData,
//       referenceModule: commentData.referenceModule,
//       referenceModuleInitData: commentData.referenceModuleInitData,
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const commentWithSigData: CommentWithSigData = {
//       ...commentData,
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "commentWithSig",
//       params: [commentWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_COMMENT_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "comment",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         profileIdPointed: commentData.profileIdPointed,
//         pubIdPointed: commentData.pubIdPointed,
//         contentURI: commentData.contentURI,
//         collectModule: commentData.collectModule,
//         referenceModule: commentData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventCommentCreated;
//   }

//   public async mirror(mirrorData: MirrorData) {
//     await this.checker.checkCapability();

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "mirror",
//       params: [mirrorData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_MIRROR_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "mirror",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         profileIdPointed: mirrorData.profileIdPointed,
//         pubIdPointed: mirrorData.pubIdPointed,
//         referenceModule: mirrorData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventMirrorCreated;
//   }

//   public async mirrorWithSig(mirrorData: MirrorData) {
//     await this.checker.checkCapability();

//     const nonce = await this.getSigNonce();

//     const sig = await this._getMirrorWithSigPartsByWallet({
//       profileId: mirrorData.profileId,
//       profileIdPointed: mirrorData.profileIdPointed,
//       pubIdPointed: mirrorData.pubIdPointed,
//       referenceModuleData: mirrorData.referenceModuleData,
//       referenceModule: mirrorData.referenceModule,
//       referenceModuleInitData: mirrorData.referenceModuleInitData,
//       nonce,
//       deadline: MAX_UINT256,
//       wallet: this.runtimeConnector.signer as Wallet,
//       lensHubAddr: this.lensContractsAddress.LensHubProxy,
//       chainId: this.runtimeConnector.chain!.chainId,
//     });

//     const mirrorWithSigData: MirrorWithSigData = {
//       ...mirrorData,
//       sig,
//     };

//     const res = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "mirrorWithSig",
//       params: [mirrorWithSigData],
//     });

//     const targetEvent = Object.values(res.events).find((event: any) => {
//       return event.topics[0] === EVENT_SIG_MIRROR_CREATED;
//     });

//     try {
//       await this._persistPublication({
//         pubType: "mirror",
//         profileId: (targetEvent as any).topics[1],
//         pubId: (targetEvent as any).topics[2],
//         profileIdPointed: mirrorData.profileIdPointed,
//         pubIdPointed: mirrorData.pubIdPointed,
//         referenceModule: mirrorData.referenceModule,
//       });
//     } catch (e) {
//       console.warn(e);
//     }

//     return {
//       profileId: (targetEvent as any).topics[1],
//       pubId: (targetEvent as any).topics[2],
//     } as EventMirrorCreated;
//   }

//   public async getCollectNFT({
//     profileId,
//     pubId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//   }) {
//     this.checker.checkWallet();

//     const collectNFT = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getCollectNFT",
//       params: [profileId, pubId],
//     });

//     return collectNFT;
//   }

//   public async isCollected({
//     collectNFT,
//     collector,
//   }: {
//     collectNFT: string;
//     collector: string;
//   }) {
//     this.checker.checkWallet();

//     const balance = await this.runtimeConnector.contractCall({
//       contractAddress: collectNFT,
//       abi: CollectNFTJson.abi,
//       method: "balanceOf",
//       params: [collector],
//     });

//     return BigNumber.from(balance).gt(0);
//   }

//   public async getCollectModule({
//     profileId,
//     pubId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//   }) {
//     this.checker.checkWallet();

//     const collectModule = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getCollectModule",
//       params: [profileId, pubId],
//     });

//     return collectModule as string;
//   }

//   public async getFollowModule(profileId: BigNumberish) {
//     this.checker.checkWallet();

//     const followModule = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getFollowModule",
//       params: [profileId],
//     });

//     return followModule as string;
//   }

//   public async getReferenceModule({
//     profileId,
//     pubId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//   }) {
//     this.checker.checkWallet();

//     const referenceModule = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "getReferenceModule",
//       params: [profileId, pubId],
//     });

//     return referenceModule as string;
//   }

//   public async isFollowModuleWhitelisted(followModule: string) {
//     this.checker.checkWallet();

//     const isWhitelisted = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "isFollowModuleWhitelisted",
//       params: [followModule],
//     });

//     return isWhitelisted;
//   }

//   public async isReferenceModuleWhitelisted(referenceModule: string) {
//     this.checker.checkWallet();

//     const isWhitelisted = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "isReferenceModuleWhitelisted",
//       params: [referenceModule],
//     });

//     return isWhitelisted;
//   }

//   public async isCollectModuleWhitelisted(collectModule: string) {
//     this.checker.checkWallet();

//     const isWhitelisted = await this.runtimeConnector.contractCall({
//       contractAddress: this.lensContractsAddress.LensHubProxy,
//       abi: LensHubJson.abi,
//       method: "isCollectModuleWhitelisted",
//       params: [collectModule],
//     });

//     return isWhitelisted;
//   }

//   public async getPersistedPublications() {
//     await this.checker.checkCapability();

//     const pkh = await this.runtimeConnector.getCurrentPkh();
//     const streams = await this.runtimeConnector.loadStreamsBy({
//       modelId: this.modelIds[ModelType.Publication],
//       pkh,
//     });
//     return streams;
//   }

//   public async getPersistedCollections() {
//     await this.checker.checkCapability();

//     const pkh = await this.runtimeConnector.getCurrentPkh();
//     const streams = await this.runtimeConnector.loadStreamsBy({
//       modelId: this.modelIds[ModelType.Collection],
//       pkh,
//     });
//     return streams;
//   }

//   private async _getFollowValidateData({
//     followModule,
//     profileId,
//   }: {
//     followModule: string;
//     profileId: BigNumberish;
//   }) {
//     let followModuleValidateData;
//     let profileData;
//     switch (followModule) {
//       case this.lensContractsAddress.ProfileFollowModule: {
//         console.log("[ProfileFollowModule]");
//         followModuleValidateData = [];
//         break;
//       }
//       case this.lensContractsAddress.RevertFollowModule: {
//         console.log("[RevertFollowModule]");
//         followModuleValidateData = [];
//         break;
//       }
//       case this.lensContractsAddress.FeeFollowModule: {
//         console.log("[FeeFollowModule]");
//         profileData = await this.runtimeConnector.contractCall({
//           contractAddress: followModule,
//           abi: FeeFollowModuleJson.abi,
//           method: "getProfileData",
//           params: [profileId],
//         });
//         followModuleValidateData = ethers.utils.defaultAbiCoder.encode(
//           ["address", "uint256"],
//           [profileData.currency, profileData.amount]
//         );
//         break;
//       }
//       default: {
//         console.log("[Default]");
//         followModuleValidateData = [];
//         break;
//       }
//     }
//     return {
//       followModuleValidateData,
//       profileData,
//     };
//   }

//   private async _getCollectValidateData({
//     profileId,
//     pubId,
//     collectModule,
//   }: {
//     profileId: string;
//     pubId: string;
//     collectModule: string;
//   }) {
//     let collectModuleValidateData;
//     let publicationData;
//     switch (collectModule) {
//       case this.lensContractsAddress.FeeCollectModule: {
//         console.log("[FeeCollectModule]");

//         publicationData = await this.runtimeConnector.contractCall({
//           contractAddress: collectModule,
//           abi: FeeCollectModuleJson.abi,
//           method: "getPublicationData",
//           params: [profileId, pubId],
//         });

//         collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
//           ["address", "uint256"],
//           [publicationData.currency, publicationData.amount]
//         );
//         break;
//       }

//       case this.lensContractsAddress.LimitedFeeCollectModule: {
//         console.log("[LimitedFeeCollectModule]");

//         publicationData = await this.runtimeConnector.contractCall({
//           contractAddress: collectModule,
//           abi: LimitedFeeCollectModuleJson.abi,
//           method: "getPublicationData",
//           params: [profileId, pubId],
//         });

//         collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
//           ["address", "uint256"],
//           [publicationData.currency, publicationData.amount]
//         );
//         break;
//       }

//       case this.lensContractsAddress.TimedFeeCollectModule: {
//         console.log("[TimedFeeCollectModule]");

//         publicationData = await this.runtimeConnector.contractCall({
//           contractAddress: collectModule,
//           abi: TimedFeeCollectModuleJson.abi,
//           method: "getPublicationData",
//           params: [profileId, pubId],
//         });

//         collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
//           ["address", "uint256"],
//           [publicationData.currency, publicationData.amount]
//         );
//         break;
//       }

//       case this.lensContractsAddress.LimitedTimedFeeCollectModule: {
//         console.log("[LimitedTimedFeeCollectModule]");

//         publicationData = await this.runtimeConnector.contractCall({
//           contractAddress: collectModule,
//           abi: LimitedTimedFeeCollectModuleJson.abi,
//           method: "getPublicationData",
//           params: [profileId, pubId],
//         });

//         collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
//           ["address", "uint256"],
//           [publicationData.currency, publicationData.amount]
//         );
//         break;
//       }

//       default: {
//         console.log("[Default]");

//         collectModuleValidateData = [];
//         break;
//       }
//     }

//     return {
//       collectModuleValidateData,
//       publicationData,
//     };
//   }

//   private async _approveERC20({
//     contract,
//     owner,
//     spender,
//     amount,
//   }: {
//     contract: string;
//     owner: string;
//     spender: string;
//     amount: BigNumberish;
//   }) {
//     const allowance = await this.runtimeConnector.contractCall({
//       contractAddress: contract,
//       abi: [
//         {
//           constant: true,
//           inputs: [
//             {
//               name: "_owner",
//               type: "address",
//             },
//             {
//               name: "_spender",
//               type: "address",
//             },
//           ],
//           name: "allowance",
//           outputs: [
//             {
//               name: "",
//               type: "uint256",
//             },
//           ],
//           payable: false,
//           stateMutability: "view",
//           type: "function",
//         },
//       ],
//       method: "allowance",
//       params: [owner, spender],
//     });
//     if (BigNumber.from(allowance).lt(amount)) {
//       await this.runtimeConnector.contractCall({
//         contractAddress: contract,
//         abi: [
//           {
//             constant: false,
//             inputs: [
//               {
//                 name: "_spender",
//                 type: "address",
//               },
//               {
//                 name: "_value",
//                 type: "uint256",
//               },
//             ],
//             name: "approve",
//             outputs: [
//               {
//                 name: "",
//                 type: "bool",
//               },
//             ],
//             payable: false,
//             stateMutability: "nonpayable",
//             type: "function",
//           },
//         ],
//         method: "approve",
//         params: [spender, amount],
//       });
//     }
//   }

//   private _initLensContractsAddress(network: LensNetwork) {
//     switch (network) {
//       case LensNetwork.PloygonMainnet: {
//         this.lensContractsAddress = POLYGON_CONTRACTS_ADDRESS;
//         break;
//       }
//       case LensNetwork.MumbaiTestnet: {
//         this.lensContractsAddress = MUMBAI_CONTRACTS_ADDRESS;
//         break;
//       }
//       case LensNetwork.SandboxMumbaiTestnet: {
//         this.lensContractsAddress = SANDBOX_MUMBAI_CONTRACTS_ADDRESS;
//         break;
//       }
//     }
//   }

//   private _initLensApiLink(network: LensNetwork) {
//     switch (network) {
//       case LensNetwork.PloygonMainnet: {
//         this.lensApiLink = "https://api.lens.dev";
//         break;
//       }
//       case LensNetwork.MumbaiTestnet: {
//         this.lensApiLink = "https://api-mumbai.lens.dev";
//         break;
//       }
//       case LensNetwork.SandboxMumbaiTestnet: {
//         this.lensApiLink = "https://api-sandbox-mumbai.lens.dev";
//         break;
//       }
//     }
//   }

//   private _domain(
//     lensHubAddr: string,
//     chainId: number
//   ): {
//     name: string;
//     version: string;
//     chainId: number;
//     verifyingContract: string;
//   } {
//     return {
//       name: LENS_HUB_NFT_NAME,
//       version: "1",
//       chainId: chainId,
//       verifyingContract: lensHubAddr,
//     };
//   }

//   private async _getFollowWithSigPartsByWallet({
//     profileIds,
//     datas,
//     nonce,
//     deadline,
//     wallet,
//     lensHubAddr,
//     chainId,
//   }: {
//     profileIds: Array<string>;
//     datas: Array<any[]>;
//     nonce: number;
//     deadline: string;
//     wallet: Wallet;
//     lensHubAddr: string;
//     chainId: number;
//   }): Promise<EIP712Signature> {
//     const msgParams = {
//       types: {
//         FollowWithSig: [
//           { name: "profileIds", type: "uint256[]" },
//           { name: "datas", type: "bytes[]" },
//           { name: "nonce", type: "uint256" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: this._domain(lensHubAddr, chainId),
//       value: {
//         profileIds,
//         datas,
//         nonce,
//         deadline,
//       },
//     };

//     const sig = await wallet._signTypedData(
//       msgParams.domain,
//       msgParams.types,
//       msgParams.value
//     );
//     const { r, s, v } = ethers.utils.splitSignature(sig);

//     return {
//       r,
//       s,
//       v,
//       deadline,
//     } as EIP712Signature;
//   }

//   private async _getPostWithSigPartsByWallet({
//     profileId,
//     contentURI,
//     collectModule,
//     collectModuleInitData,
//     referenceModule,
//     referenceModuleInitData,
//     nonce,
//     deadline,
//     wallet,
//     lensHubAddr,
//     chainId,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     collectModule: string;
//     collectModuleInitData: any[];
//     referenceModule: string;
//     referenceModuleInitData: any[];
//     nonce: number;
//     deadline: string;
//     wallet: Wallet;
//     lensHubAddr: string;
//     chainId: number;
//   }): Promise<EIP712Signature> {
//     const msgParams = {
//       types: {
//         PostWithSig: [
//           { name: "profileId", type: "uint256" },
//           { name: "contentURI", type: "string" },
//           { name: "collectModule", type: "address" },
//           { name: "collectModuleInitData", type: "bytes" },
//           { name: "referenceModule", type: "address" },
//           { name: "referenceModuleInitData", type: "bytes" },
//           { name: "nonce", type: "uint256" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: this._domain(lensHubAddr, chainId),
//       value: {
//         profileId,
//         contentURI,
//         collectModule,
//         collectModuleInitData,
//         referenceModule,
//         referenceModuleInitData,
//         nonce,
//         deadline,
//       },
//     };
//     const sig = await wallet._signTypedData(
//       msgParams.domain,
//       msgParams.types,
//       msgParams.value
//     );
//     const { r, s, v } = ethers.utils.splitSignature(sig);

//     return {
//       r,
//       s,
//       v,
//       deadline,
//     } as EIP712Signature;
//   }

//   private async _getCollectWithSigPartsByWallet({
//     profileId,
//     pubId,
//     data,
//     nonce,
//     deadline,
//     wallet,
//     lensHubAddr,
//     chainId,
//   }: {
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//     data: any[];
//     nonce: number;
//     deadline: string;
//     wallet: Wallet;
//     lensHubAddr: string;
//     chainId: number;
//   }): Promise<EIP712Signature> {
//     const msgParams = {
//       types: {
//         CollectWithSig: [
//           { name: "profileId", type: "uint256" },
//           { name: "pubId", type: "uint256" },
//           { name: "data", type: "bytes" },
//           { name: "nonce", type: "uint256" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: this._domain(lensHubAddr, chainId),
//       value: {
//         profileId,
//         pubId,
//         data,
//         nonce,
//         deadline,
//       },
//     };

//     const sig = await wallet._signTypedData(
//       msgParams.domain,
//       msgParams.types,
//       msgParams.value
//     );
//     const { r, s, v } = ethers.utils.splitSignature(sig);

//     return {
//       r,
//       s,
//       v,
//       deadline,
//     } as EIP712Signature;
//   }

//   private async _getCommentWithSigPartsByWallet({
//     profileId,
//     contentURI,
//     profileIdPointed,
//     pubIdPointed,
//     referenceModuleData,
//     collectModule,
//     collectModuleInitData,
//     referenceModule,
//     referenceModuleInitData,
//     nonce,
//     deadline,
//     wallet,
//     lensHubAddr,
//     chainId,
//   }: {
//     profileId: BigNumberish;
//     contentURI: string;
//     profileIdPointed: BigNumberish;
//     pubIdPointed: BigNumberish;
//     referenceModuleData: any[];
//     collectModule: string;
//     collectModuleInitData: any[];
//     referenceModule: string;
//     referenceModuleInitData: any[];
//     nonce: number;
//     deadline: string;
//     wallet: Wallet;
//     lensHubAddr: string;
//     chainId: number;
//   }): Promise<EIP712Signature> {
//     const msgParams = {
//       types: {
//         CommentWithSig: [
//           { name: "profileId", type: "uint256" },
//           { name: "contentURI", type: "string" },
//           { name: "profileIdPointed", type: "uint256" },
//           { name: "pubIdPointed", type: "uint256" },
//           { name: "referenceModuleData", type: "bytes" },
//           { name: "collectModule", type: "address" },
//           { name: "collectModuleInitData", type: "bytes" },
//           { name: "referenceModule", type: "address" },
//           { name: "referenceModuleInitData", type: "bytes" },
//           { name: "nonce", type: "uint256" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: this._domain(lensHubAddr, chainId),
//       value: {
//         profileId,
//         contentURI,
//         profileIdPointed,
//         pubIdPointed,
//         referenceModuleData,
//         collectModule,
//         collectModuleInitData,
//         referenceModule,
//         referenceModuleInitData,
//         nonce,
//         deadline,
//       },
//     };

//     const sig = await wallet._signTypedData(
//       msgParams.domain,
//       msgParams.types,
//       msgParams.value
//     );
//     const { r, s, v } = ethers.utils.splitSignature(sig);

//     return {
//       r,
//       s,
//       v,
//       deadline,
//     } as EIP712Signature;
//   }

//   private async _getMirrorWithSigPartsByWallet({
//     profileId,
//     profileIdPointed,
//     pubIdPointed,
//     referenceModuleData,
//     referenceModule,
//     referenceModuleInitData,
//     nonce,
//     deadline,
//     wallet,
//     lensHubAddr,
//     chainId,
//   }: {
//     profileId: BigNumberish;
//     profileIdPointed: BigNumberish;
//     pubIdPointed: BigNumberish;
//     referenceModuleData: any[];
//     referenceModule: string;
//     referenceModuleInitData: any[];
//     nonce: number;
//     deadline: string;
//     wallet: Wallet;
//     lensHubAddr: string;
//     chainId: number;
//   }): Promise<EIP712Signature> {
//     const msgParams = {
//       types: {
//         MirrorWithSig: [
//           { name: "profileId", type: "uint256" },
//           { name: "profileIdPointed", type: "uint256" },
//           { name: "pubIdPointed", type: "uint256" },
//           { name: "referenceModuleData", type: "bytes" },
//           { name: "referenceModule", type: "address" },
//           { name: "referenceModuleInitData", type: "bytes" },
//           { name: "nonce", type: "uint256" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: this._domain(lensHubAddr, chainId),
//       value: {
//         profileId,
//         profileIdPointed,
//         pubIdPointed,
//         referenceModuleData,
//         referenceModule,
//         referenceModuleInitData,
//         nonce,
//         deadline,
//       },
//     };

//     const sig = await wallet._signTypedData(
//       msgParams.domain,
//       msgParams.types,
//       msgParams.value
//     );
//     const { r, s, v } = ethers.utils.splitSignature(sig);

//     return {
//       r,
//       s,
//       v,
//       deadline,
//     } as EIP712Signature;
//   }

//   private async _persistPublication({
//     pubType,
//     profileId,
//     pubId,
//     profileIdPointed,
//     pubIdPointed,
//     contentURI,
//     collectModule,
//     referenceModule,
//   }: {
//     pubType: "post" | "comment" | "mirror";
//     profileId: BigNumberish;
//     pubId: BigNumberish;
//     profileIdPointed?: BigNumberish;
//     pubIdPointed?: BigNumberish;
//     contentURI?: string;
//     collectModule?: string;
//     referenceModule: string;
//   }) {
//     await this.runtimeConnector.createStream({
//       modelId: this.modelIds[ModelType.Publication],
//       streamContent: {
//         post_type: pubType,
//         profile_id: profileId,
//         pub_id: pubId,
//         profile_id_pointed: profileIdPointed,
//         pub_id_pointed: pubIdPointed,
//         content_uri: contentURI,
//         collect_module: collectModule,
//         reference_module: referenceModule,
//         created_at: Date.now(),
//       },
//     });
//   }

//   private async _persistCollection({
//     profileId,
//     pubId,
//   }: {
//     profileId: string;
//     pubId: string;
//   }) {
//     const collectNFT = await this.getCollectNFT({
//       profileId,
//       pubId,
//     });
//     await this.runtimeConnector.createStream({
//       modelId: this.modelIds[ModelType.Collection],
//       streamContent: {
//         profile_id: profileId,
//         pub_id: pubId,
//         collect_nft: collectNFT,
//         collected_at: Date.now(),
//       },
//     });
//   }
// }
