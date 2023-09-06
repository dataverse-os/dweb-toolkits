import SismoCredentialJson from "./contracts/SismoCredential.json";
import CredentialFactoryJson from "./contracts/CredentialFactory.json";
import {BigNumberish, Contract, Signer} from "ethers";
import {CredentialInfo, GroupSetup} from "./types";
import {querySismoGroupInfoById} from "./services";
import {CREDENTIAL_FACTORY_MUMBAI_ADDRESS, ZERO_ADDRESS} from "./constants";

export class SismoClient {
  private _sismoCredential: Contract;
  private _credentialAddress: string;
  
  constructor(signer: Signer) {
	this._credentialAddress = ZERO_ADDRESS;
	this._sismoCredential = new Contract(
	  ZERO_ADDRESS,
	  SismoCredentialJson.abi,
	  signer,
	);
  }
  
  public attach(credentialAddress: string) {
	this._credentialAddress = credentialAddress;
	this._sismoCredential = this._sismoCredential.attach(credentialAddress);
  }
  
  public getGroupIds() {
	this._credentialAttached();
	return this._sismoCredential.getGroupIds();
  }
  
  public async getSismoGroupInfo(groupId: string) {
	try {
	  const res = await querySismoGroupInfoById(groupId)
	  return res;
	} catch (e) {
	  throw new Error("query sismo group info error");
	}
  }
  
  public hasCredential(accountAddress: string): Promise<boolean> {
	this._credentialAttached();
	return this._sismoCredential.isInDataGroup(accountAddress);
  }
  
  public async bindCredential({
								accountAddress,
								responseBytes,
							  }: {
	accountAddress: string;
	responseBytes: string;
  }) {
	this._credentialAttached();
	const tx = await this._sismoCredential.bindCredential(
	  accountAddress,
	  responseBytes,
	);
	return tx.wait();
  }
  
  public async getCredentialInfo({accountAddress, groupId}: {
	accountAddress: string,
	groupId: string
  }): Promise<CredentialInfo> {
	this._credentialAttached();
	const reputationInfo: CredentialInfo =
	  await this._sismoCredential.getCredentialInfo(accountAddress, groupId);
	return reputationInfo;
  }
  
  public async getGroupSetup(groupId: string): Promise<GroupSetup> {
	this._credentialAttached();
	const groupSetup: GroupSetup =
	  await this._sismoCredential.getGroupSetup(groupId);
	return groupSetup;
  }
  
  public async getCredentialInfoList(
	accountAddress: string,
  ): Promise<CredentialInfo[]> {
	this._credentialAttached();
	const reputationInfo: CredentialInfo[] =
	  await this._sismoCredential.getCredentialInfoList(accountAddress);
	return reputationInfo;
  }
  
  /**
   * @notice only callable by contract owner
   */
  public async addDataGroups(groupSetup: GroupSetup[]) {
	this._credentialAttached();
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
		await this.getSismoGroupInfo(setup.groupId);
	  } catch (e) {
		throw new Error(`${setup.groupId} does not exist in sismo.io`);
	  }
	}
  }
  
  private _credentialAttached() {
	if (this._credentialAddress == ZERO_ADDRESS) {
	  throw new Error("attach credential contract first");
	}
  }
}

export class CredentialDeployer {
  
  private _credentialFactory: Contract
  
  constructor(signer: Signer) {
	this._credentialFactory = new Contract(
	  CREDENTIAL_FACTORY_MUMBAI_ADDRESS,
	  CredentialFactoryJson.abi,
	  signer,
	)
  }
  
  public async deployCredential({sismoAppId, duration, isImpersonationMode, groupSetup}: {
	sismoAppId: string,
	duration: BigNumberish,
	isImpersonationMode: boolean,
	groupSetup: GroupSetup[]
  }) {
	let newCredential;
	await this._credentialFactory.createCredential(sismoAppId, duration, isImpersonationMode, groupSetup).then(
	  async (tx: any) => {
		const r = await tx.wait();
		console.log('receipt: ', r);
		r.events.forEach((e: any) => {
		  if (e.event == `CredentialDeployed`) {
			newCredential = e.args?.newCredential;
		  }
		})
	  }
	);
	return newCredential;
  }
  
}