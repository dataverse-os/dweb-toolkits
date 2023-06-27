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
  r: string;
  s: string;
  v: number;
  deadline: string;
};

export type CreateProfileData = {
  to: string;
  handle: string;
  imageURI: string;
  followModule: string;
  followModuleInitData: any[];
  followNFTURI: string;
};

export type FollowWithSigData = {
  follower: string;
  profileIds: Array<string>;
  datas: Array<any[]>;
  sig: EIP712Signature;
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
  sig: EIP712Signature;
};

export type CollectWithSigData = {
  collector: string;
  profileId: BigNumberish;
  pubId: BigNumberish;
  data: any[];
  sig: EIP712Signature;
};

export type CommentData = {
  profileId: BigNumberish;
  contentURI: string;
  profileIdPointed: BigNumberish;
  pubIdPointed: BigNumberish;
  referenceModuleData: any[];
  collectModule: string;
  collectModuleInitData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
};

export type CommentWithSigData = {
  profileId: BigNumberish;
  contentURI: string;
  profileIdPointed: BigNumberish;
  pubIdPointed: BigNumberish;
  referenceModuleData: any[];
  collectModule: string;
  collectModuleInitData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
  sig: EIP712Signature;
};

export type MirrorData = {
  profileId: BigNumberish;
  profileIdPointed: BigNumberish;
  pubIdPointed: BigNumberish;
  referenceModuleData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
};

export type MirrorWithSigData = {
  profileId: BigNumberish;
  profileIdPointed: BigNumberish;
  pubIdPointed: BigNumberish;
  referenceModuleData: any[];
  referenceModule: string;
  referenceModuleInitData: any[];
  sig: EIP712Signature;
};
