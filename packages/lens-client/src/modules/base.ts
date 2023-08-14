import { DataverseConnector, SYSTEM_CALL } from "@dataverse/dataverse-connector";
import { Checker } from "@dataverse/utils-toolkit";
import { BigNumber, BigNumberish } from "ethers";
import {
  LENS_HUB_NFT_NAME,
  MUMBAI_CONTRACTS_ADDRESS,
  POLYGON_CONTRACTS_ADDRESS,
  SANDBOX_MUMBAI_CONTRACTS_ADDRESS,
} from "../constants";
import { LensNetwork, ModelIds, ModelType } from "../types";
import LensHubJson from "../../contracts/LensHub.json";
import { WalletProvider } from "@dataverse/wallet-provider";

export class ClientBase {
  public modelIds: ModelIds;
  public lensContractsAddress!: any;
  public lensApiLink!: string;
  public dataverseConnector: DataverseConnector;
  public walletProvider: WalletProvider;
  public checker: Checker;
  public network: LensNetwork;

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
    this.modelIds = modelIds;
    this.dataverseConnector = dataverseConnector;
    this.walletProvider = walletProvider;
    this.network = network;
    this.checker = new Checker(dataverseConnector);
    this._initLensContractsAddress(network);
  }

  public async getSigNonce() {
    this.checker.checkWallet();

    const address = this.dataverseConnector.address!;

    const nonce = await this.walletProvider.contractCall({
      contractAddress: this.lensContractsAddress.LensHubProxy,
      abi: LensHubJson.abi,
      method: "sigNonces",
      params: [address],
    })

    return nonce;
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

  protected _domain(
    lensHubAddr: string,
    chainId: number
  ): {
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

  protected async _approveERC20({
    contract,
    owner,
    spender,
    amount,
  }: {
    contract: string;
    owner: string;
    spender: string;
    amount: BigNumberish;
  }) {
    const allowance = await this.walletProvider.contractCall({
      contractAddress: contract,
      abi: [
        {
          constant: true,
          inputs: [
            {
              name: "_owner",
              type: "address",
            },
            {
              name: "_spender",
              type: "address",
            },
          ],
          name: "allowance",
          outputs: [
            {
              name: "",
              type: "uint256",
            },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      method: "allowance",
      params: [owner, spender],
    });
    if (BigNumber.from(allowance).lt(amount)) {
      await this.walletProvider.contractCall({
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
      });
    }
  }

  protected async _persistPublication({
    pubType,
    profileId,
    pubId,
    modelId,
    profileIdPointed,
    pubIdPointed,
    contentURI,
    collectModule,
    referenceModule,
  }: {
    pubType: "post" | "comment" | "mirror";
    profileId: BigNumberish;
    pubId: BigNumberish;
    modelId?: string;
    profileIdPointed?: BigNumberish;
    pubIdPointed?: BigNumberish;
    contentURI?: string;
    collectModule?: string;
    referenceModule: string;
  }) {
    return await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.createStream,
      params: {
        modelId: this.modelIds[ModelType.Publication],
        streamContent: {
          publication_type: pubType,
          profile_id: profileId,
          pub_id: pubId,
          model_id: modelId,
          profile_id_pointed: profileIdPointed,
          pub_id_pointed: pubIdPointed,
          content_uri: contentURI,
          collect_module: collectModule,
          reference_module: referenceModule,
          created_at: Date.now(),
        },
      },
    });
  }
}
