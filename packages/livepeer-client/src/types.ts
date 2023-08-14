interface Hash {
  hash: string;
  algorithm: string;
}
interface Source {
  type: string;
}
interface Status {
  phase: string;
  updatedAt: number;
  tasks?: {
    last: string;
  };
}
interface NftMetadata {
  cid: string;
  url: string;
  gatewayUrl: string;
}
interface Storage {
  ipfs: {
    cid: string;
    spec?: {
      nftMetadata: NftMetadata;
    };
    updatedAt: number;
    nftMetadata: NftMetadata;
    url: string;
    gatewayUrl: string;
  };
  status: Status;
}
export interface Video {
  id: string;
  hash: Hash[];
  name: string;
  size: number;
  source: Source;
  status: Status;
  userId: string;
  storage?: Storage;
  createdAt: number;
  videoSpec: {
    format: string;
    duration: number;
  };
  playbackId: string;
  downloadUrl: string;
  playbackUrl: string;
}


export interface Stream {
  pkh: string;
  app: string;
  modelId: string;
  streamId: string;
  streamContent: {
    content: {
      name: string;
      storage: string;
      user_id: string;
      asset_id: string;
      encrypted: string;
      created_at: number;
      playback_id: string;
      source_type: string;
      status_phase: string;
      status_updated_at: number;
    },
    file: {
      appVersion: string;
      contentId: string;
      contentType: string;
      comment: {
        mirrorName: string;
        note: string;
        tags: string[];
      },
      fileType: number;
      encryptedSymmetricKey: string;
      decryptionConditions: {
        contractAddress: string;
        standardContractType: string;
        chain: string;
        method: string;
        parameters: string[];
        returnValueTest: {
          comparator: string;
          value: string;
        }
      }[];
      decryptionConditionsType: string;
      createdAt: string;
      updatedAt: string;
      indexFileId: string;
    }
  }
}

export type IndexFileId = string;