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

  public async setRevertFollowModule(profileId: BigNumberish) {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, LENS_CONTRACTS_ADDRESS.RevertFollowModule, []],
      mode: Mode.Write,
    });

    console.log("[setFollowModule]res:", res);
  }

  public async testMint() {
    const res = await this.runtimeConnector.contractCall({
      contractAddress: "0xd2e8B003B2650B34B00B43FE09142c0c6C9345b7",
      abi: [
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "tokenId",
              "type": "uint256"
            }
          ],
          "name": "mint",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      method: "mint",
      params: [BigInt(10)],
      mode: Mode.Write
    })
    console.log("mint success, res:", res);
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
    console.log("start");
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

    console.log("postData:", postData);

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
      mode: Mode.Write,
    });

    console.log("[createFreeCollectPost]res:", res);
    return res;
  }

  public async createRevertCollectPost({
    profileId,
    contentURI,
  }: {
    profileId: BigNumberish;
    contentURI: string;
  }) {
    const postData: PostData = {
      profileId,
      contentURI,
      collectModule: LENS_CONTRACTS_ADDRESS.RevertCollectModule,
      collectModuleInitData: [],
      referenceModule: ethers.constants.AddressZero,
      referenceModuleInitData: [],
    };

    console.log("postData:", postData);

    const res = await this.runtimeConnector.contractCall({
      contractAddress: LENS_CONTRACTS_ADDRESS.lensHubProxy,
      abi: LensHubJson.abi,
      method: "post",
      params: [postData],
      mode: Mode.Write,
    });

    console.log("[createRevertCollectPost]res:", res);
    return res;
  }

  public async collect({
    profileId,
    pubId,
    collectModuleValidateParams,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
    collectModuleValidateParams?: {
      currency: string;
      amount: BigNumberish;
    };
  }) {
    let collectModuleValidateData;
    if (collectModuleValidateParams) {
      collectModuleValidateData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [
          collectModuleValidateParams.currency,
          collectModuleValidateParams.amount,
        ]
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
