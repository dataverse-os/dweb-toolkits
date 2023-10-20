import { ReturnType } from "@dataverse/dataverse-connector";

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


export type Stream = Awaited<ReturnType['loadFile']>;

export type IndexFileId = string;