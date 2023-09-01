import { BigNumberish } from "ethers";

export type CredentialInfo = {
  groupId: string;
  expiredAt: BigNumberish;
  value: boolean;
};

export type GroupSetup = {
  startAt: BigNumberish;
  groupId: string;
  duration: BigNumberish;
};

export type SismoGroupInfo = {
  id: string;
  latestSnapshot: {
    id: string;
    group: {
      id: string;
      name: string;
      description: string;
      specs: string;
      generationFrequency: string;
    };
    timestamp: string;
    size: number;
    valueDistribution: {
      value: string;
      numberOfAccounts: number;
    }[];
    dataUrl: string;
  };
  snapshots: {
    id: string;
    timestamp: string;
    size: number;
    dataUrl: string;
  }[];
  name: string;
  description: string;
  specs: string;
  generationFrequency: string;
};
