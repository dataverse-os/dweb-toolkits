import { RuntimeConnector } from "@dataverse/runtime-connector";

export class Checker {
  private runtimeConnector: RuntimeConnector;

  constructor(runtimeConnector: RuntimeConnector) {
    this.runtimeConnector = runtimeConnector;
  }

  public checkWallet() {
    if (!this.runtimeConnector.address) {
      throw new Error("Need to connect wallet");
    }
  }

  public async checkCapability() {
    const hasCapability = await this.runtimeConnector.checkCapability();
    if (!hasCapability) {
      throw new Error("Need to create capability");
    }
  }
}