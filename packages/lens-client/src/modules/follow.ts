import { RuntimeConnector } from "@dataverse/runtime-connector";
import { BigNumber, BigNumberish, ethers, Wallet } from "ethers";
import {
  MAX_UINT256,
  EVENT_SIG_FOLLOWED,
} from "../constants";
import {
  EIP712Signature,
  EventFollowed,
  FollowWithSigData,
  LensNetwork,
  ModelIds,
} from "../types";
import { ClientBase } from "./base";
import LensHubJson from "../../contracts/LensHub.json";
import FollowNFTJson from "../../contracts/FollowNFT.json";
import FeeFollowModuleJson from "../../contracts/modules/follow/FeeFollowModule.json";

export class Follow extends ClientBase {
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

  public async getFollowNFT(profileId: BigNumberish) {
    this.checker.checkWallet();

    const followNFT = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getFollowNFT",
      params: [profileId],
    });

    return followNFT;
  }

  public async getFollowModule(profileId: BigNumberish) {
    this.checker.checkWallet();

    const followModule = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getFollowModule",
      params: [profileId],
    });

    return followModule as string;
  }

  public async isFollowModuleWhitelisted(followModule: string) {
    this.checker.checkWallet();

    const isWhitelisted = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "isFollowModuleWhitelisted",
      params: [followModule],
    });

    return isWhitelisted;
  }

  public async follow(profileIds: string[]) {
    this.checker.checkWallet();

    const datas = await Promise.all(
      profileIds.map(async (profileId) => {
        const followModule = await this.getFollowModule(profileId);
        const { followModuleValidateData, profileData } =
          await this._getFollowValidateData({
            profileId,
            followModule,
          });
        if (profileData) {
          await this._approveERC20({
            contract: profileData.currency,
            owner: this.runtimeConnector.address!,
            spender: followModule,
            amount: profileData.amount,
          });
        }
        return followModuleValidateData;
      })
    );
    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "follow",
      params: [profileIds, datas],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_FOLLOWED;
    });

    return {
      follower: (targetEvent as any).topics[1],
    } as EventFollowed;
  }

  public async followWithSig(profileIds: string[]) {
    this.checker.checkWallet();

    const datas = await Promise.all(
      profileIds.map(async (profileId) => {
        const followModule = await this.getFollowModule(profileId);
        const { followModuleValidateData, profileData } =
          await this._getFollowValidateData({
            profileId,
            followModule,
          });
        if (profileData) {
          await this._approveERC20({
            contract: profileData.currency,
            owner: this.runtimeConnector.address!,
            spender: followModule,
            amount: profileData.amount,
          });
        }
        return followModuleValidateData;
      })
    );

    const nonce = await this.getSigNonce();
    const sig = await this._getFollowWithSigPartsByWallet({
      profileIds,
      datas,
      nonce,
      deadline: MAX_UINT256,
      wallet: this.runtimeConnector.signer as Wallet,
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.runtimeConnector.chain!.chainId,
    });

    const followWithSigData: FollowWithSigData = {
      follower: this.runtimeConnector.address!,
      profileIds,
      datas,
      sig,
    };

    const res = await this.runtimeConnector.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "followWithSig",
      params: [followWithSigData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_FOLLOWED;
    });

    return {
      follower: (targetEvent as any).topics[1],
    } as EventFollowed;
  }

  public async isFollowed({
    followNFT,
    follower,
  }: {
    followNFT: string;
    follower: string;
  }) {
    this.checker.checkWallet();

    const balance = await this.runtimeConnector.contractCall({
      contractAddress: followNFT,
      abi: FollowNFTJson.abi,
      method: "balanceOf",
      params: [follower],
    });

    return BigNumber.from(balance).gt(0);
  }

  private async _getFollowValidateData({
    followModule,
    profileId,
  }: {
    followModule: string;
    profileId: BigNumberish;
  }) {
    let followModuleValidateData;
    let profileData;
    switch (followModule) {
      case this.lensContractsAddress.ProfileFollowModule: {
        console.log("[ProfileFollowModule]");
        followModuleValidateData = [];
        break;
      }
      case this.lensContractsAddress.RevertFollowModule: {
        console.log("[RevertFollowModule]");
        followModuleValidateData = [];
        break;
      }
      case this.lensContractsAddress.FeeFollowModule: {
        console.log("[FeeFollowModule]");
        profileData = await this.runtimeConnector.contractCall({
          contractAddress: followModule,
          abi: FeeFollowModuleJson.abi,
          method: "getProfileData",
          params: [profileId],
        });
        followModuleValidateData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [profileData.currency, profileData.amount]
        );
        break;
      }
      default: {
        console.log("[Default]");
        followModuleValidateData = [];
        break;
      }
    }
    return {
      followModuleValidateData,
      profileData,
    };
  }

  private async _getFollowWithSigPartsByWallet({
    profileIds,
    datas,
    nonce,
    deadline,
    wallet,
    lensHubAddr,
    chainId,
  }: {
    profileIds: Array<string>;
    datas: Array<any[]>;
    nonce: number;
    deadline: string;
    wallet: Wallet;
    lensHubAddr: string;
    chainId: number;
  }): Promise<EIP712Signature> {
    const msgParams = {
      types: {
        FollowWithSig: [
          { name: "profileIds", type: "uint256[]" },
          { name: "datas", type: "bytes[]" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      domain: this._domain(lensHubAddr, chainId),
      value: {
        profileIds,
        datas,
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
