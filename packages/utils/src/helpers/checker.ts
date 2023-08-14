import { DataverseConnector, SYSTEM_CALL } from "@dataverse/dataverse-connector";

export class Checker {
  private dataverseConnector: DataverseConnector;

  constructor(dataverseConnector: DataverseConnector) {
    this.dataverseConnector = dataverseConnector;
  }

  public checkWallet() {
    if (!this.dataverseConnector.address) {
      throw new Error("Need to connect wallet");
    }
  }

  public async checkCapability() {
    const hasCapability = await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.checkCapability,
    });
    if (!hasCapability) {
      throw new Error("Need to create capability");
    }
  }
}
