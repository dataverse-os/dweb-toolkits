import { Signer } from "ethers";
import { GroupSetup } from "../types";
import { querySismoGroupInfoById } from "../services";
import { SismoCredentialClientBase } from "./base/SismoCredentialClientBase";

export class SismoCredentialAdminClient extends SismoCredentialClientBase {
  constructor(signer: Signer, contractAddr: string) {
    super(signer, contractAddr);
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

  /**
   * @notice only callable by contract owner
   */
  public async deleteDataGroups(groupIds: string[]) {
    const tx = await this._sismoCredential.deleteDataGroups(groupIds);
    return tx.wait();
  }

  private async _checkGroupIds(groupSetup: GroupSetup[]) {
    for (const setup of groupSetup) {
      try {
        await querySismoGroupInfoById(setup.groupId);
      } catch (e) {
        throw new Error(`${setup.groupId} does not exist in sismo.io`);
      }
    }
  }
}

