import { BigNumberish } from "ethers";

export type EventProfileCreated = {
  profileId: BigNumberish;
  creator: string;
  to: string;
};

export type EventPostCreated = {
  profileId: BigNumberish;
  pubId: BigNumberish;
};

export type EventCollected = {
  collector: string;
  profileId: BigNumberish;
  pubId: BigNumberish;
};

export type EventCommentCreated = {
  profileId: BigNumberish;
  pubId: BigNumberish;
};

export type EventMirrorCreated = {
  profileId: BigNumberish;
  pubId: BigNumberish;
};
