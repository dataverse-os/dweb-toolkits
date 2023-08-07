import { DataverseConnector } from "@dataverse/dataverse-connector";
import { BigNumberish, ethers, Wallet } from "ethers";
import { MAX_UINT256, EVENT_SIG_MIRROR_CREATED } from "../constants";
import {
  EIP712Signature,
  EventMirrorCreated,
  LensNetwork,
  MirrorData,
  MirrorWithSigData,
  ModelIds,
} from "../types";
import LensHubJson from "../../contracts/LensHub.json";
import { ClientBase } from "./base";
import { WalletProvider } from "@dataverse/wallet-provider";

export class Mirror extends ClientBase {
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

  public async getReferenceModule({
    profileId,
    pubId,
  }: {
    profileId: BigNumberish;
    pubId: BigNumberish;
  }) {
    this.checker.checkWallet();

    const referenceModule = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "getReferenceModule",
      params: [profileId, pubId],
    });

    return referenceModule as string;
  }

  public async isReferenceModuleWhitelisted(referenceModule: string) {
    this.checker.checkWallet();

    const isWhitelisted = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "isReferenceModuleWhitelisted",
      params: [referenceModule],
    });

    return isWhitelisted;
  }

  public async mirror(mirrorData: MirrorData) {
    await this.checker.checkCapability();

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "mirror",
      params: [mirrorData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_MIRROR_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "mirror",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        profileIdPointed: mirrorData.profileIdPointed,
        pubIdPointed: mirrorData.pubIdPointed,
        referenceModule: mirrorData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventMirrorCreated;
  }

  public async mirrorWithSig(mirrorData: MirrorData) {
    await this.checker.checkCapability();

    const nonce = await this.getSigNonce();

    const sig = await this._getMirrorWithSigPartsByWallet({
      profileId: mirrorData.profileId,
      profileIdPointed: mirrorData.profileIdPointed,
      pubIdPointed: mirrorData.pubIdPointed,
      referenceModuleData: mirrorData.referenceModuleData,
      referenceModule: mirrorData.referenceModule,
      referenceModuleInitData: mirrorData.referenceModuleInitData,
      nonce,
      deadline: MAX_UINT256,
      wallet: this.dataverseConnector.getProvider(),
      lensHubAddr: this.lensContractsAddress.LensHubProxy,
      chainId: this.dataverseConnector.chain!.chainId,
    });

    const mirrorWithSigData: MirrorWithSigData = {
      ...mirrorData,
      sig,
    };

    const res = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "mirrorWithSig",
      params: [mirrorWithSigData],
    });

    const targetEvent = Object.values(res.events).find((event: any) => {
      return event.topics[0] === EVENT_SIG_MIRROR_CREATED;
    });

    try {
      await this._persistPublication({
        pubType: "mirror",
        profileId: (targetEvent as any).topics[1],
        pubId: (targetEvent as any).topics[2],
        profileIdPointed: mirrorData.profileIdPointed,
        pubIdPointed: mirrorData.pubIdPointed,
        referenceModule: mirrorData.referenceModule,
      });
    } catch (e) {
      console.warn(e);
    }

    return {
      profileId: (targetEvent as any).topics[1],
      pubId: (targetEvent as any).topics[2],
    } as EventMirrorCreated;
  }

  private async _getMirrorWithSigPartsByWallet({
    profileId,
    profileIdPointed,
    pubIdPointed,
    referenceModuleData,
    referenceModule,
    referenceModuleInitData,
    nonce,
    deadline,
    wallet,
    lensHubAddr,
    chainId,
  }: {
    profileId: BigNumberish;
    profileIdPointed: BigNumberish;
    pubIdPointed: BigNumberish;
    referenceModuleData: any[];
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
        MirrorWithSig: [
          { name: "profileId", type: "uint256" },
          { name: "profileIdPointed", type: "uint256" },
          { name: "pubIdPointed", type: "uint256" },
          { name: "referenceModuleData", type: "bytes" },
          { name: "referenceModule", type: "address" },
          { name: "referenceModuleInitData", type: "bytes" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      domain: this._domain(lensHubAddr, chainId),
      value: {
        profileId,
        profileIdPointed,
        pubIdPointed,
        referenceModuleData,
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
