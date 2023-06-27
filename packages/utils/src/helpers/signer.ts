import { Bytes, Signer } from "ethers";
import {
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { RuntimeConnector, SignMethod } from "@dataverse/runtime-connector";

export class RuntimeConnectorSigner extends Signer {
  runtimeConnector: RuntimeConnector;

  constructor(runtimeConnector: RuntimeConnector) {
    super();
    this.runtimeConnector = runtimeConnector;
  }

  public connect(): Signer {
    return this;
  }

  public async signMessage(message: Bytes | string): Promise<string> {
    return await this.runtimeConnector.sign({
      method: SignMethod.signMessage,
      params: [message],
    });
  }

  public async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    return await this.runtimeConnector.sign({
      method: SignMethod._signTypedData,
      params: [domain, types, value],
    });
  }

  public async getAddress(): Promise<string> {
    return this.runtimeConnector.signer!.getAddress();
  }

  public signTransaction(): Promise<string> {
    throw new Error("'signTransaction' is unsupported !");
  }
}
