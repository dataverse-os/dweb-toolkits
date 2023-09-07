import { Contract, Signer } from "ethers";
import SismoCredentialJson from "../../contracts/SismoCredential.json";
import { CredentialInfo, GroupSetup } from "../../types";
import { querySismoGroupInfoById } from "../../services";

export class SismoCredentialClientBase {
  protected _sismoCredential: Contract;

  constructor(signer: Signer, contractAddr: string) {
    this._sismoCredential = new Contract(
      contractAddr,
      SismoCredentialJson.abi,
      signer
    );
  }

  public getRefreshDuration() {
    return this._sismoCredential.getRefreshDuration();
  }

  public getGroupIds() {
    return this._sismoCredential.getGroupIds();
  }

  public async getSismoGroupInfo(groupId: string) {
    return querySismoGroupInfoById(groupId);
  }

  public hasCredential(accountAddress: string): Promise<boolean> {
    return this._sismoCredential.isInDataGroup(accountAddress);
  }

  public async getCredentialInfo({
    accountAddress,
    groupId,
  }: {
    accountAddress: string;
    groupId: string;
  }): Promise<CredentialInfo> {
    const reputationInfo: CredentialInfo =
      await this._sismoCredential.getCredentialInfo(accountAddress, groupId);
    return reputationInfo;
  }

  public async getGroupSetup(groupId: string): Promise<GroupSetup> {
    const groupSetup: GroupSetup = await this._sismoCredential.getGroupSetup(
      groupId
    );
    return groupSetup;
  }

  public async getCredentialInfoList(
    accountAddress: string
  ): Promise<CredentialInfo[]> {
    const reputationInfo: CredentialInfo[] =
      await this._sismoCredential.getCredentialInfoList(accountAddress);
    return reputationInfo;
  }
}

