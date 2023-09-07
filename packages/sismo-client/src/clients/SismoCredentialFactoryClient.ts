import SismoCredentialFactoryJson from "../contracts/SismoCredentialFactory.json";
import { BigNumberish, Contract, Signer } from "ethers";
import { GroupSetup } from "../types";

export class SismoCredentialFactoryClient {
  private _credentialFactory: Contract;

  constructor(signer: Signer, accountAddr: string) {
    this._credentialFactory = new Contract(
      accountAddr,
      SismoCredentialFactoryJson.abi,
      signer
    );
  }

  public async deploySismoCredential({
    sismoAppId,
    duration,
    isImpersonationMode,
    groupSetup,
  }: {
    sismoAppId: string;
    duration: BigNumberish;
    isImpersonationMode: boolean;
    groupSetup: GroupSetup[];
  }): Promise<string> {
    const tx = await this._credentialFactory.createCredential(
      sismoAppId,
      duration,
      isImpersonationMode,
      groupSetup
    );
    const result = await tx.wait();

    const targetEvent = result.events.filter(
      (elem: any) => elem.event === "CredentialDeployed"
    );

    return targetEvent[0].args.newCredential;
  }
}
