import SismoCredentialJson from "./contracts/SismoCredential.json";
import { Contract, Signer } from "ethers";
import { CredentialInfo, GroupSetup } from "./types";
import { querySismoGroupInfoById } from "./services";

export class SismoClient {
  private _sismoCredential: Contract;

  constructor({
    contractAddr,
    signer,
  }: {
    contractAddr: string;
    signer: Signer;
  }) {
    this._sismoCredential = new Contract(
      contractAddr,
      SismoCredentialJson.abi,
      signer,
    );
  }

  public getGroupIds() {
    return this._sismoCredential.getGroupIds();
  }

  public getSismoGroupInfo(groupId: string) {
    return querySismoGroupInfoById(groupId);
  }

  public hasCredential(accountAddress: string): Promise<boolean> {
    return this._sismoCredential.isInDataGroup(accountAddress);
  }

  public async bindCredential({
    accountAddress,
    responseBytes,
  }: {
    accountAddress: string;
    responseBytes: string;
  }) {
    const tx = await this._sismoCredential.bindCredential(
      accountAddress,
      responseBytes,
    );
    return tx.wait();
  }

  public async getCredentialInfo({accountAddress, groupId}:{accountAddress: string, groupId: string}): Promise<CredentialInfo> {
    const reputationInfo: CredentialInfo =
      await this._sismoCredential.getCredentialInfo(accountAddress, groupId);
    return reputationInfo;
  }
  
  public async getGroupSetup(groupId: string): Promise<GroupSetup> {
    const groupSetup: GroupSetup =
      await this._sismoCredential.getGroupSetup(groupId);
    return groupSetup;
  }
  
  public async getCredentialInfoList(
    accountAddress: string,
  ): Promise<CredentialInfo[]> {
    const reputationInfo: CredentialInfo[] =
      await this._sismoCredential.getCredentialInfoList(accountAddress);
    return reputationInfo;
  }

  /**
   * @notice only callable by contract owner
   */
  public async addDataGroups(groupSetup: GroupSetup[]) {
    const tx = await this._sismoCredential.addDataGroups(groupSetup);
    return tx.wait();
  }

  /**
   * @notice only callable by contract owner
   */
  public async deleteDataGroups(groupIds: string[]) {
    const tx = await this._sismoCredential.deleteDataGroups(groupIds);
    return tx.wait();
  }
}
