import { DataverseConnector } from "@dataverse/dataverse-connector";

export class Checker {
  private dataverseConnector: DataverseConnector;

  constructor(dataverseConnector: DataverseConnector) {
    this.dataverseConnector = dataverseConnector;
  }

  public checkWallet() {
    if (!this.dataverseConnector.getProvider().address) {
      throw new Error("Need to connect wallet");
    }
  }

  public async checkCapability() {
    const hasCapability = await this.dataverseConnector.checkCapability();
    if (!hasCapability) {
      throw new Error("Need to create capability");
    }
  }
}