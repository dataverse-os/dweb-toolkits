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
