import {
  Mode,
  // DatatokenVars,
  RuntimeConnector,
  // StreamContent,
} from "@dataverse/runtime-connector";
import {
  // ethers,
  BigNumberish,
  ethers,
} from "ethers";
import { LENS_CONTRACTS_ADDRESS } from "./constants";
import { PostData, ProfileStruct } from "./types";
import LensHubJson from "../contracts/LensHub.sol/LensHub.json";

// import { StreamHelper } from "@dataverse/utils-toolkit";

export class LensClient {
  public runtimeConnector: RuntimeConnector;

  constructor({ runtimeConnector }: { runtimeConnector: RuntimeConnector }) {
    this.runtimeConnector = runtimeConnector;
  }

  public async createProfile(handle: string) {
    const res = await this.runtimeConnector.createProfile(handle);
    return res;
  }

  public async getProfiles(address: string) {
    const res = await this.runtimeConnector.getProfiles(address);
    return res;
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

  public async setFeeFollowModule({
    profileId,
    followModule,
  }: // moduleInitData,
  {
    profileId: BigNumberish;
    followModule: string;
    moduleInitParams?: {
      amount: BigNumberish;
      currency: string;
      recipient: string;
    };
  }) {
    // const moduleInitDataBytes = ethers.utils.defaultAbiCoder.encode(
    //   ["uint256", "address", "address"],
    //   [moduleInitData.amount, moduleInitData.currency, moduleInitData.recipient]
    // );
    // const moduleInitDataBytes = [];
    // console.log("moduleInitDataBytes:", moduleInitDataBytes);
    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, followModule, []],
      mode: Mode.Write,
    });

    console.log("[setFollowModule]res:", res);
  }

  public async isCollected({
    collectNFT,
    collector,
  }: {
    collectNFT: string;
    collector: string;
  }) {
    const res = await this.runtimeConnector.isCollected({
      datatokenId: collectNFT,
      address: collector,
    });
    return res;
  }

  public async createFreeCollectPost({
    profileId,
    contentURI,
    collectModuleInitParams,
  }: {
    profileId: BigNumberish;
    contentURI: string;
    collectModuleInitParams: {
      followerOnly: boolean;
    };
  }) {
    console.log("start")
    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [collectModuleInitParams.followerOnly]
    );

    const postData: PostData = {
      profileId,
      contentURI,
      collectModule: LENS_CONTRACTS_ADDRESS.FreeCollectModule,
      collectModuleInitData,
      referenceModule: ethers.constants.AddressZero,
      referenceModuleInitData: [],
    };

    console.log("postData:", postData)

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
      mode: Mode.Write,
    });

    console.log("[createFreeCollectPost]res:", res)
    return res;
  }

  public async collect({
    profileId,
    pubId,
    collectModuleValidateParams
  }:{
    profileId: BigNumberish,
    pubId: BigNumberish,
    collectModuleValidateParams?: {
      currency: string,
      amount: BigNumberish
    }
  }) {
    let collectModuleValidateData;
    if(collectModuleValidateParams) {
      collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [collectModuleValidateParams.currency, collectModuleValidateParams.amount]
      );
    } else {
      collectModuleValidateData = [];
    }

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "collect",
      params: [profileId, pubId, collectModuleValidateData],
      mode: Mode.Write,
    });

    return res;
  }

  // public async getProfileIdByName({
  //   account,
  //   lensNickName,
  // }: {
  //   account: string;
  //   lensNickName?: string;
  // }) {
  //   const lensProfiles = await this.runtimeConnector.getProfiles(account);

  //   let profileId;
  //   if (lensProfiles?.[0]?.id) {
  //     profileId = lensProfiles?.[0]?.id;
  //   } else {
  //     if (!lensNickName) {
  //       throw "Please pass in lensNickName";
  //     }
  //     if (!/^[\da-z]{5,26}$/.test(lensNickName) || lensNickName.length > 26) {
  //       throw "Only supports lower case characters, numbers, must be minimum of 5 length and maximum of 26 length";
  //     }
  //     profileId = await this.runtimeConnector.createProfile(lensNickName);
  //   }
  //   return profileId;
  // }
}
