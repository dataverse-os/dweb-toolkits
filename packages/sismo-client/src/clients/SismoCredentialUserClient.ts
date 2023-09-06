import SismoCredentialJson from "../contracts/SismoCredential.json";
import { Contract, Signer } from "ethers";
import { CredentialInfo, GroupSetup } from "../types";
import { querySismoGroupInfoById } from "../services";

export class SismoCredentialUserClient {
  private _sismoCredential: Contract;

  constructor(signer: Signer, contractAddr: string) {
    this._sismoCredential = new Contract(
      contractAddr,
      SismoCredentialJson.abi,
      signer
    );
  }

  public getGroupIds() {
    return this._sismoCredential.getGroupIds();
  }

  public async getSismoGroupInfo(groupId: string) {
    try {
      const res = await querySismoGroupInfoById(groupId);
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
      responseBytes
    );
    return tx.wait();
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

