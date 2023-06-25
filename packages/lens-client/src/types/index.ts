import { BigNumberish } from "ethers";

export type ProfileStruct = {
  pubCount: BigNumberish;
  followModule: string;
  followNFT: string;
  handle: string;
  imageURI: string;
  followNFTURI: string;
};

export type EIP712Signature = {
  v: number;
  r: string; 
  s: string;
  deadline: string;
}

export type CreateProfileData = {
  to: string;
  handle: string;
  imageURI: string;
  followModule: string;
  followModuleInitData: any[];
  followNFTURI: string;
};

export type PostData = {
  profileId: BigNumberish;
  contentURI: string;
  collectModule: string;
  collectModuleInitData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
};

export type PostWithSigData = {
  profileId: BigNumberish;
  contentURI: string;
  collectModule: string;
  collectModuleInitData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
  sig: Sig;
}

export type CollectWithSigData = {
  collector: string;
  profileId: BigNumberish;
  pubId: BigNumberish;
  data: any[];
  sig: EIP712Signature;
}

export type EventPostCreated = {
  profileId: BigNumberish;
  pubId: BigNumberish;
};

export type EventCollected = {
  collector: string;
  profileId: BigNumberish;
  pubId: BigNumberish;
};

export type Sig = {
  r: string; s: string;
  v: number;
  deadline: string
};