import { Signer } from "ethers";
import { SismoCredentialClientBase } from "./base/SismoCredentialClientBase";

export class SismoCredentialUserClient extends SismoCredentialClientBase {
  constructor(signer: Signer, contractAddr: string) {
    super(signer, contractAddr);
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
}

