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
  
	public async deployCredential({
	  sismoAppId,
	  duration,
	  isImpersonationMode,
	  groupSetup,
	}: {
	  sismoAppId: string;
	  duration: BigNumberish;
	  isImpersonationMode: boolean;
	  groupSetup: GroupSetup[];
	}) {
	  let newCredential;
	  await this._credentialFactory
		.createCredential(sismoAppId, duration, isImpersonationMode, groupSetup)
		.then(async (tx: any) => {
		  const r = await tx.wait();
		  r.events.forEach((e: any) => {
			if (e.event == `CredentialDeployed`) {
			  newCredential = e.args?.newCredential;
			}
		  });
		});
	  return newCredential;
	}
  }

