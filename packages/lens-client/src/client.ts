import {
  // DatatokenVars,
  RuntimeConnector,
  // StreamContent,
} from "@dataverse/runtime-connector";

// import { StreamHelper } from "@dataverse/utils-toolkit";

export class LensClient {
  public runtimeConnector: RuntimeConnector;

  constructor({ runtimeConnector }: { runtimeConnector: RuntimeConnector }) {
    this.runtimeConnector = runtimeConnector;
  }

  public async createLensProfile(handle: string) {
    const res = await this.runtimeConnector.createProfile(handle);
    return res;
  }

  public async getLensProfiles(address: string) {
    const res = await this.runtimeConnector.getProfiles(address);
    return res;
  }

  public async isCollected({
    collectNFT,
    address,
  }: {
    collectNFT: string;
    address: string;
  }) {
    const res = await this.runtimeConnector.isCollected({
      datatokenId: collectNFT,
      address,
    });
    return res;
  }

  public async getProfileIdByName({
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
