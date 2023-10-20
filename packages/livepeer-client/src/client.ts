import {
  DatatokenVars,
  DataverseConnector,
  SYSTEM_CALL,
} from "@dataverse/dataverse-connector";

import {
  createReactClient,
  LivepeerConfig,
  ReactClient,
  studioProvider,
} from "@livepeer/react";
import axios, { AxiosInstance } from "axios";
import { Checker } from "@dataverse/utils-toolkit";
import { Video, Stream, IndexFileId } from "./types";
import { FileContent } from "@dataverse/dataverse-connector/dist/esm/types/fs";

export { LivepeerConfig, createReactClient, ReactClient };

export class LivepeerClient {
  private http: AxiosInstance;
  private checker: Checker;
  public apiKey: string;
  public reactClient: ReactClient;
  public modelId: string;
  public dataverseConnector: DataverseConnector;

  constructor({
    apiKey,
    dataverseConnector,
    modelId,
  }: {
    apiKey: string;
    dataverseConnector: DataverseConnector;
    modelId: string;
  }) {
    this.apiKey = apiKey;
    this.reactClient = createReactClient({
      provider: studioProvider({ apiKey }),
    });
    this.modelId = modelId;
    this.dataverseConnector = dataverseConnector;
    this.checker = new Checker(dataverseConnector);

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

  public async uploadVideo(rawVideoFile: any) {
    await this.checker.checkCapability();

    const postRes = await this.http.post("request-upload", {
      name: rawVideoFile.name,
    });

    const http = axios.create({
      baseURL: "https://livepeer.studio/api/asset/",
      timeout: 1000 * 60 * 10,
      headers: {
        Authorization: `Bearer \t${this.apiKey}`,
        "Content-Type": rawVideoFile.type,
      },
    });

    await http.put((postRes as any).url, rawVideoFile);

    const videoMeta = (postRes as any).asset;
    const stream = await this._persistAssetMeta(videoMeta);

    return {
      videoMeta,
      stream,
    };
  }

  public async retrieveVideo(assetId: string) {
    return this.http.get(assetId);
  }

  public async retrieveVideos() {
    return this.http.get("");
  }

  public async deleteVideo(assetId: string) {
    return this.http.delete(assetId);
  }

  public async getVideoMetaList() {
    await this.checker.checkCapability();
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    const streams = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadFilesBy,
      params: {
        modelId: this.modelId,
        pkh: pkh,
      },
    });
    const assets = [];
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        assets.push(streams[key]);
      }
    }
    await this._syncVideoWithLivepeer(assets as unknown as Stream[]);
    return assets;
  }

  public async monetizeVideoMeta({
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
    await this.checker.checkCapability();

    if (!datatokenVars.profileId) {
      datatokenVars.profileId = await this._getProfileId({
        address,
        lensNickName,
      });
    }

    await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.monetizeFile,
      params: {
        fileId: streamId,
        datatokenVars,
      },
    });
  }

  private _persistAssetMeta(assetMeta: any) {
    const livepeerAsset: FileContent = this._generateAssetMeta(assetMeta);
    return this.dataverseConnector.runOS({
      method: SYSTEM_CALL.createIndexFile,
      params: {
        modelId: this.modelId,
        fileContent: livepeerAsset,
      },
    });
  }

  private _generateAssetMeta(assetMeta: any) {
    const encrypted = JSON.stringify({
      storage: false,
      playback_id: true,
    });
    return {
      asset_id: assetMeta.id,
      name: assetMeta.name,
      source_type: assetMeta.source.type ? assetMeta.source.type : "",
      status_phase: assetMeta.status.phase,
      status_updated_at: assetMeta.status.updatedAt,
      user_id: assetMeta.userId,
      storage: "",
      created_at: assetMeta.createdAt,
      playback_id: assetMeta.playbackId,
      encrypted,
    };
  }

  private async _syncVideoWithLivepeer(streams: Stream[]) {
    const videos = (await this.retrieveVideos()) as unknown as Video[];
    const videosMap = new Map<string, Video>();
    videos.forEach((video: Video) => {
      videosMap.set(video.id, video);
    });

    // find out no exist stream to delete , remove matched video from videoMap
    const streamToDelete = new Set<IndexFileId>();
    streams.forEach((stream) => {
      if (!videosMap.has(stream.fileContent.content.asset_id)) {
        streamToDelete.add(stream.fileContent.file.fileId);
      } else {
        videosMap.delete(stream.fileContent.content.asset_id);
      }
    });

    this.dataverseConnector.runOS({
      method: SYSTEM_CALL.removeFiles,
      params: {
        fileIds: [...streamToDelete],
      },
    });

    // the remaining of videoMap should be not exist in folder, so add it
    videosMap.forEach((value: Video, _: string) => {
      this._persistAssetMeta(value).catch((_: Error) => { });
    });
  }

  private async _getProfileId({
    address,
    lensNickName,
  }: {
    address: string;
    lensNickName?: string;
  }) {
    const lensProfiles = await this.dataverseConnector.getProfiles(address);

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
      profileId = await this.dataverseConnector.createProfile(lensNickName);
    }
    return profileId;
  }
}
