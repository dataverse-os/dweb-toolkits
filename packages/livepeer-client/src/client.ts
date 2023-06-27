import {
  DatatokenVars,
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
import { StreamHelper } from "@dataverse/utils-toolkit";

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

  public persistAssetMeta(assetMeta: any) {
    const livepeerAsset: StreamContent = this._generateAssetMeta(assetMeta);
    return this.runtimeConnector.createStream({
      modelId: this.modelId,
      streamContent: livepeerAsset,
    });
  }

  public async getAssetMetaList() {
    const pkh = await this.runtimeConnector.getCurrentPkh();
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
    const pkh = await this.runtimeConnector.getCurrentPkh();
    const streams = await this.runtimeConnector.loadStreamsBy({
      modelId: this.modelId,
      pkh: pkh,
    });

    const streamFilter = (streamContent: StreamContent) => {
      return streamContent.content.asset_id == livepeerAsset.asset_id;
    };
    const updateStream = async (streamContent: StreamContent) => {
      await this.runtimeConnector.updateStream({
        streamId: streamContent.file.contentId,
        streamContent: livepeerAsset,
      });
    };

    await StreamHelper.traverseStreams(
      streams,
      streamFilter,
      updateStream,
      () => {}
    );
  }

  public async monetizeAssetMeta({
    address,
    streamId,
    lensNickName,
    datatokenVars,
  }: {
    address: string;
    streamId: string;
    lensNickName?: string;
    datatokenVars: Omit<DatatokenVars, "streamId">;
  }) {
    if (!datatokenVars.profileId) {
      datatokenVars.profileId = await this._getProfileId({
        address,
        lensNickName,
      });
    }

    await this.runtimeConnector.monetizeFile({
      streamId,
      datatokenVars,
    });
  }

  private _generateAssetMeta(assetMeta: StreamContent) {
    const encrypted = JSON.stringify({
      storage: false,
      playback_id: true,
      playback_url: true,
      download_url: true,
    });
    console.log("assetMeta: ", assetMeta);
    return {
      asset_id: assetMeta.id,
      hash: JSON.stringify(assetMeta.hash),
      name: assetMeta.name,
      size: assetMeta.size,
      source_type: assetMeta.source.type ? assetMeta.source.type : "",
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

  private async _getProfileId({
    address,
    lensNickName,
  }: {
    address: string;
    lensNickName?: string;
  }) {
    const lensProfiles = await this.runtimeConnector.getProfiles(address);

    let profileId;
    if (lensProfiles?.[0]?.id) {
      profileId = lensProfiles?.[0]?.id;
    } else {
      if (!lensNickName) {
        throw "Please pass in lensNickName";
      }
      if (!/^[\da-z]{5,26}$/.test(lensNickName) || lensNickName.length > 26) {
        throw "Only supports lower case characters, numbers, must be minimum of 5 length and maximum of 26 length";
      }
      profileId = await this.runtimeConnector.createProfile(lensNickName);
    }
    return profileId;
  }
}
