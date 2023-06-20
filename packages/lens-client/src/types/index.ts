import { BigNumberish } from "ethers";

export type ProfileStruct = {
  pubCount: BigNumberish;
  followModule: string;
  followNFT: string;
  handle: string;
  imageURI: string;
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
