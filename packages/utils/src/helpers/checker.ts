import { CoreConnector, Methods } from "@dataverse/core-connector";

export class Checker {
  private coreConnector: CoreConnector;

  constructor(coreConnector: CoreConnector) {
    this.coreConnector = coreConnector;
  }

  public checkWallet() {
    if (!this.coreConnector.address) {
      throw new Error("Need to connect wallet");
    }
  }

  public async checkCapability() {
    const hasCapability = await this.coreConnector.runOS({
      method: Methods.checkCapability,
    });
    if (!hasCapability) {
      throw new Error("Need to create capability");
    }
  }
}
