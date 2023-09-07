import React from "react";
import {ethers} from "ethers";
import {GroupSetup, SismoCredentialAdminClient} from "@dataverse/sismo-client";
import {abbreviateAddress} from "../../utils";
import {useNavigate} from "react-router-dom";
import { WalletProvider } from "@dataverse/wallet-provider";
import { WALLET } from "@dataverse/dataverse-connector";

const mockGroupId_01 = "0x4350b6e49eb734978ec285e740f54848";
const mockGroupId_02 = "0xaa329246800f36e70eefbc38c7bb018e";

const Admin = () => {
  const navigate = useNavigate();
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialAdminClient, setSismoCredentialAdminClient] =
	React.useState<SismoCredentialAdminClient>();
  
  const connectWallet = async () => {
    const walletProvider = new WalletProvider();

    const { address } = await walletProvider.connectWallet(WALLET.METAMASK);
    setAddress(address);

    const provider = new ethers.providers.Web3Provider(walletProvider);
	
	const signer = provider.getSigner();
	const client = new SismoCredentialAdminClient(signer, process.env.SISMO_CREDENTIAL_CONTRACT!);
	
	setSismoCredentialAdminClient(client);
  };
  
  const getGroupIds = async () => {
	const result = await sismoCredentialAdminClient?.getGroupIds();
	console.log("getGroupIds result:", result);
  }
  
  const addDataGroups = async () => {
	if (!address) {
	  throw new Error("Address undefined!");
	}
	
	const startAt = (Date.now() / 1000).toFixed(0);
	const duration = 60 * 60 * 24;
	const dataGroups: GroupSetup[] = [
	  {
		startAt: startAt,
		groupId: mockGroupId_01,
		duration: duration,
	  },
	  {
		startAt: startAt,
		groupId: mockGroupId_02,
		duration: duration,
	  },
	];
	
	const result = await sismoCredentialAdminClient?.addDataGroups(dataGroups);
	console.log("addDataGroups result:", result);
  };
  
  const deleteDataGroups = async () => {
	if (!address) {
	  throw new Error("Address undefined!");
	}
	
	const dataGroups = [mockGroupId_01];
	const result = await sismoCredentialAdminClient?.deleteDataGroups(dataGroups);
	console.log("deleteDataGroups result:", result);
  };
  
  return (
	<>
	  <button onClick={connectWallet}> connectWallet</button>
	  <br/>
	  {address ? abbreviateAddress(address) : undefined}
	  <br/>
	  <button onClick={getGroupIds}> getGroupIds</button>
	  <br/>
	  <button onClick={addDataGroups}> addDataGroups</button>
	  <br/>
	  <button onClick={deleteDataGroups}> deleteDataGroups</button>
	  <br/>
	  <button className='router' onClick={() => navigate("/user")}>
		Go To User
	  </button>
	  <br/>
	</>
  );
};

export {Admin};
