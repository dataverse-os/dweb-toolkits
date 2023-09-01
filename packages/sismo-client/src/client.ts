import SismoCredentialJson from "./contracts/SismoCredential.json";
import { Contract, Signer } from "ethers";
import { CredentialInfo, GroupSetup } from "./types";
import { querySismoGroupInfoById } from "./services";

export class SismoClient {
  private _sismoCrendential: Contract;

  constructor({
    contractAddr,
    signer,
  }: {
    contractAddr: string;
    signer: Signer;
  }) {
    this._sismoCrendential = new Contract(
      contractAddr,
      SismoCredentialJson.abi,
      signer,
    );
  }

  public getGroupIds() {
    return this._sismoCrendential.getGroupIds();
  }

  public getSismoGroupInfo(groupId: string) {
    return querySismoGroupInfoById(groupId);
  }

  public hasCredential(accountAddress: string): Promise<boolean> {
    return this._sismoCrendential.isInDataGroup(accountAddress);
  }

  public async bindCredential({
    accountAddress,
    responseBytes,
  }: {
    accountAddress: string;
    responseBytes: string;
  }) {
    const tx = await this._sismoCrendential.bindCredential(
      accountAddress,
      responseBytes,
    );
    return tx.wait();
  }

  public async getCredentialInfoList(
    accountAddress: string,
  ): Promise<CredentialInfo[]> {
    const reputationInfo: CredentialInfo[] =
      await this._sismoCrendential.getCredentialInfoList(accountAddress);
    return reputationInfo;
  }

  /**
   * @notice only callable by contract owner
   */
  public async addDataGroups(groupSetup: GroupSetup[]) {
    const tx = await this._sismoCrendential.addDataGroups(groupSetup);
    return tx.wait();
  }

  /**
   * @notice only callable by contract owner
   */
  public async deleteDataGroups(groupIds: string[]) {
    const tx = await this._sismoCrendential.deleteDataGroups(groupIds);
    return tx.wait();
  }
}
