import { Signer, BigNumberish } from "ethers";
import { GroupSetup } from "../types";
import { SismoCredentialClientBase } from "./base/SismoCredentialClientBase";

export class SismoCredentialAdminClient extends SismoCredentialClientBase {
  constructor(signer: Signer, contractAddr: string) {
    super(signer, contractAddr);
  }

  public async setRefreshDuration(refreshDuration: BigNumberish) {
    const tx = await this._sismoCredential.setRefreshDuration(refreshDuration);
    return tx.wait();
  }

  public async addDataGroups(groupSetup: GroupSetup[]) {
    if (!groupSetup || groupSetup.length === 0) {
      throw new Error("groupSetup is empty or null");
    }
    await this._checkGroupIds(groupSetup);
    const tx = await this._sismoCredential.addDataGroups(groupSetup);
    return tx.wait();
  }

  public async deleteDataGroups(groupIds: string[]) {
    const tx = await this._sismoCredential.deleteDataGroups(groupIds);
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
}

