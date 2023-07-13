import { CoreConnector, Methods } from "@dataverse/core-connector";
import { Profile, Follow, Post, Comment, Collect, Mirror } from "./modules";
import { ClientBase } from "./modules/base";
import { LensNetwork, ModelIds, ModelType } from "./types";
import { applyMixins } from "./utils";

class LensClient extends ClientBase {
  constructor({
    modelIds,
    coreConnector,
    network,
  }: {
    modelIds: ModelIds;
    coreConnector: CoreConnector;
    network: LensNetwork;
  }) {
    super({
      modelIds,
      coreConnector,
      network,
    });
  }

  public async getPersistedPublications() {
    await this.checker.checkCapability();

    const pkh = await this.coreConnector.runOS({
      method: Methods.getCurrentPkh,
    });
    const streams = await this.coreConnector.runOS({
      method: Methods.loadStreamsBy,
      params: {
        modelId: this.modelIds[ModelType.Publication],
        pkh,
      },
    });
    return streams;
  }

  public async getPersistedCollections() {
    await this.checker.checkCapability();

    const pkh = await this.coreConnector.runOS({
      method: Methods.getCurrentPkh,
    });
    const streams = await this.coreConnector.runOS({
      method: Methods.loadStreamsBy,
      params: {
        modelId: this.modelIds[ModelType.Collection],
        pkh,
      },
    });
    return streams;
  }
}

interface LensClient extends Profile, Follow, Post, Comment, Collect, Mirror {}

applyMixins(LensClient, [Profile, Follow, Post, Comment, Collect, Mirror]);

export { LensClient };
