import { FolderHelper } from "@dataverse/utils-toolkit";
import {
  MirrorFile,
  RuntimeConnector,
  StreamContent,
} from "@dataverse/runtime-connector";

import {
  createReactClient,
  LivepeerConfig,
  ReactClient,
  studioProvider,
} from "@livepeer/react";
import axios, { AxiosInstance } from "axios";

export { LivepeerConfig, createReactClient, ReactClient };

export class LivepeerClient {
  private http: AxiosInstance;
  public apiKey: string;
  public reactClient: ReactClient;
  public appName: string;
  public modelId: string;
  public runtimeConnector: RuntimeConnector;

  constructor({
    apiKey,
    runtimeConnector,
    modelId,
    appName,
  }: {
    apiKey: string;
    runtimeConnector: RuntimeConnector;
    modelId: string;
    appName: string;
  }) {
    this.apiKey = apiKey;
    this.reactClient = createReactClient({
      provider: studioProvider({ apiKey }),
    });
    this.appName = appName;
    this.modelId = modelId;
    this.runtimeConnector = runtimeConnector;

    this.http = axios.create({
      baseURL: "https://livepeer.studio/api/asset/",
      timeout: 50000,
      headers: {
        Authorization: `Bearer \t${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    this.http.interceptors.response.use(
      (response: any) => {
        return response.data;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public async retrieveAssetById(assetId: string) {
    return this.http.get(assetId);
  }

  public async retrieveAssets() {
    return this.http.get("");
  }

  public async deleteAssetById(assetId: string) {
    return this.http.delete(assetId);
  }

  public async persistAssetMeta(assetMeta: any) {
    const livepeerAsset: StreamContent = this._generateAssetMeta(assetMeta);

    await this.runtimeConnector.createStream({
      modelId: this.modelId,
      streamContent: livepeerAsset,
    });
  }

  public async getAssetMetaList() {
    const pkh = await this.runtimeConnector.wallet.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelId,
      pkh: pkh,
    });
    const assets = [];
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        assets.push(streams[key]);
      }
    }
    return assets;
  }
  public async updateAssetMeta(assetMeta: any) {
    const livepeerAsset: StreamContent = this._generateAssetMeta(assetMeta);

    const fileFilter = (file: MirrorFile) => {
      return file.content.contentType === this.modelId;
    };

    const matchedHandler = async (mirrorFile: MirrorFile) => {
      await this.runtimeConnector.updateStream({
        streamId: mirrorFile.indexFileId,
        streamContent: livepeerAsset,
      });
    };

    return FolderHelper.traverseFolders(
      this.runtimeConnector,
      fileFilter,
      matchedHandler,
      () => {}
    );
  }

  public async removeAssetMetaByAssetId(assetId: string) {
    const fileFilter = (mirrorFile: MirrorFile) => {
      return (
        mirrorFile.contentType === this.modelId &&
        mirrorFile.content.asset_id == assetId
      );
    };

    const matchedHandler = async (mirrorFile: MirrorFile) => {
      await this.runtimeConnector.removeFiles({
        indexFileIds: [mirrorFile.indexFileId],
        syncImmediately: true,
      });
    };

    return FolderHelper.traverseFolders(
      this.runtimeConnector,
      fileFilter,
      matchedHandler,
      () => {}
    );
  }

  public async removeIndexFileById(mirrorFile: MirrorFile, ...params: any[]) {
    if (mirrorFile.content.assetId == params[0]) {
      await this.runtimeConnector.removeFiles({
        indexFileIds: [mirrorFile.indexFileId],
        syncImmediately: true,
      });
    }
  }

  private _generateAssetMeta(assetMeta: StreamContent) {
    const encrypted = JSON.stringify({
      asset_id: true,
      storage: false,
      playback_id: true,
      playback_url: true,
      download_url: true,
    });
    return {
      asset_id: assetMeta.id,
      hash: JSON.stringify(assetMeta.hash),
      name: assetMeta.name,
      size: assetMeta.size,
      source_type:
        assetMeta.source.type == undefined ? "" : assetMeta.source.type,
      status_phase: assetMeta.status.phase,
      status_updated_at: assetMeta.status.updatedAt,
      user_id: assetMeta.userId,
      storage: JSON.stringify(assetMeta.storage),
      created_at: assetMeta.createdAt,
      videoSpec_format: assetMeta.videoSpec.format,
      videoSpec_duration: assetMeta.videoSpec.duration,
      playback_id: assetMeta.playbackId,
      playback_url: assetMeta.playbackUrl,
      download_url: assetMeta.downloadUrl,
      encrypted,
    };
  }
}
