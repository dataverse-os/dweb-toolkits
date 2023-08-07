import { DataverseConnector } from "@dataverse/dataverse-connector";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { EVENT_SIG_PROFILE_CREATED } from "../constants";
import {
  CreateProfileData,
  EventProfileCreated,
  LensNetwork,
  ModelIds,
  ProfileStruct,
} from "../types";
// import { request, gql } from "graphql-request";
import LensHubJson from "../../contracts/LensHub.json";
import ProfileCreationProxyJson from "../../contracts/ProfileCreationProxy.json";
import { ClientBase } from "./base";
import { WalletProvider } from "@dataverse/wallet-provider";

export class Profile extends ClientBase {
  constructor({
    modelIds,
    dataverseConnector,
    walletProvider,
    network,
  }: {
    modelIds: ModelIds;
    dataverseConnector: DataverseConnector;
    walletProvider: WalletProvider;
    network: LensNetwork;
  }) {
    super({
      modelIds,
      dataverseConnector,
      walletProvider,
      network,
    });
  }

  public async isProfileCreatorWhitelisted(profileCreator: string) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "isProfileCreatorWhitelisted",
      params: [profileCreator],
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
    this.checker.checkWallet();

    const createProfileData: CreateProfileData = {
      to,
      handle,
      imageURI,
      followModule: followModule || ethers.constants.AddressZero,
      followModuleInitData: followModuleInitData || [],
      followNFTURI: followNFTURI || "https://github.com/dataverse-os",
    };

    const res = await this.walletProvider.contractCall({
      contractAddress:
        this.network === LensNetwork.PloygonMainnet
          ? this.lensContractsAddress.ProfileCreationProxy
          : this.lensContractsAddress.MockProfileCreationProxy,
      abi: ProfileCreationProxyJson.abi,
      method: "proxyCreateProfile",
      params: [createProfileData],
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

  public async burnProfile(profileId: BigNumberish) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "burn",
      params: [profileId],
    });

    return res;
  }

  public async setDefaultProfile(profileId: BigNumberish) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setDefaultProfile",
      params: [profileId],
    });
    return res;
  }

  public async getProfiles(address: string) {
    const balance = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "balanceOf",
      params: [address],
    });

    const balanceCount = BigNumber.from(balance).toNumber();

    const container = Array.from({
      length: balanceCount,
    });

    const profileIds = await Promise.all(
      container.map((_, index) => {
        console.log("");
        return this.walletProvider.contractCall({
          contractAddress: this.lensContractsAddress.LensHubProxy,
          abi: LensHubJson.abi,
          method: "tokenOfOwnerByIndex",
          params: [address, index],
        });
      })
    );

    return profileIds.map((profileId: BigNumber) => {
      return profileId._hex;
    });
  }

  public async getProfile(profileId: BigNumberish) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfile",
      params: [profileId],
    });
    return res as ProfileStruct;
  }

  public async getProfileIdByHandle(handle: string) {
    this.checker.checkWallet();

    const profileId = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getProfileIdByHandle",
      params: [handle],
    });
    return profileId;
  }

  public async setFollowModule({
    profileId,
    followModule,
    followModuleInitData,
  }: {
    profileId: BigNumberish;
    followModule: string;
    followModuleInitData: any[];
  }) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, followModule, followModuleInitData],
    });
    return res;
  }

  public async setRevertFollowModule(profileId: BigNumberish) {
    this.checker.checkWallet();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [profileId, this.lensContractsAddress.RevertFollowModule, []],
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
    this.checker.checkWallet();

    const moduleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address"],
      [
        moduleInitParams.amount,
        moduleInitParams.currency,
        moduleInitParams.recipient,
      ]
    );

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "setFollowModule",
      params: [
        profileId,
        this.lensContractsAddress.FeeFollowModule,
        moduleInitData,
      ],
    });

    return res;
  }
}
