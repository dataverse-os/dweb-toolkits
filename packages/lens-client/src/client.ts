import { DataverseConnector, SYSTEM_CALL } from "@dataverse/dataverse-connector";
import { Profile, Follow, Post, Comment, Collect, Mirror } from "./modules";
import { ClientBase } from "./modules/base";
import { LensNetwork, ModelIds, ModelType } from "./types";
import { applyMixins } from "./utils";
import { WalletProvider } from "@dataverse/wallet-provider";

class LensClient extends ClientBase {
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

  public async getPersistedPublications() {
    await this.checker.checkCapability();
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadFilesBy,
      params: {
        modelId: this.modelIds[ModelType.Publication],
        pkh,
      },
    });
    return streams;
  }

  public async getPersistedCollections() {
    await this.checker.checkCapability();
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadFilesBy,
      params: {
        modelId: this.modelIds[ModelType.Collection],
        pkh,
      },
    });
    return streams;
  }
}

interface LensClient extends Profile, Follow, Post, Comment, Collect, Mirror { }

applyMixins(LensClient, [Profile, Follow, Post, Comment, Collect, Mirror]);

export { LensClient };
