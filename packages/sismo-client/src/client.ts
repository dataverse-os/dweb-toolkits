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

  public async getSismoGroupInfo(groupId: string) {
    try{
      const res = await querySismoGroupInfoById(groupId)
      return res;
    } catch (e) {
      throw new Error("query sismo group info error");
    }
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
    if (!groupSetup || groupSetup.length === 0) {
      throw new Error("groupSetup is empty or null");
    }
    await this._checkGroupIds(groupSetup);
    const tx = await this._sismoCredential.addDataGroups(groupSetup);
    return tx.wait();
  }
  
  private async _checkGroupIds(groupSetup: GroupSetup[]) {
    for (const setup of groupSetup) {
      try {
        await this.getSismoGroupInfo(setup.groupId);
      } catch (e) {
        throw new Error(`${setup.groupId} does not exist in sismo.io`);
      }
    }
  }

  /**
   * @notice only callable by contract owner
   */
  public async deleteDataGroups(groupIds: string[]) {
    const tx = await this._sismoCredential.deleteDataGroups(groupIds);
    return tx.wait();
  }
}
