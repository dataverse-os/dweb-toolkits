import React from "react";
import {
  AuthType,
  ClaimRequest,
  SismoConnectButton,
} from "@sismo-core/sismo-connect-react";
import {ethers, Signer} from "ethers";
import {
  CredentialInfo,
  SismoGroupInfo,
  SismoClient,
} from "@dataverse/sismo-client";
import {Post, Profile} from "../../components";
import {abbreviateAddress, abiCoder} from "../../utils";
import {useNavigate} from "react-router-dom";
import {
  DataverseConnector,
  RESOURCE,
  SYSTEM_CALL,
  WALLET,
} from "@dataverse/dataverse-connector";
import {WalletProvider} from "@dataverse/wallet-provider";
import {ModelParser} from "@dataverse/model-parser";
import appJson from "../../../output/app.json";
import {CredentialDeployer} from "../../../../src";

const mockGroupId_01 = "0x4350b6e49eb734978ec285e740f54848";
// const fackGroupId = "0x4350b6e49eb734978ec285e740f54841";
const modelParser = new ModelParser(appJson);
const dataverseConnector = new DataverseConnector();

const User = () => {
  const navigate = useNavigate();
  const [signer, setSigner] = React.useState<Signer | undefined>(undefined)
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialClient, setSismoCredentialClient] =
	React.useState<SismoClient>();
  const [credentialContractAddr, setCredentialContractAddr] = React.useState<string>()
  
  const [credentialInfoList, setCredentialInfoList] =
	React.useState<CredentialInfo[]>();
  const [groupInfoList, setGroupInfoList] = React.useState<SismoGroupInfo[]>();
  const [responseBytes, setResponseBytes] = React.useState<string>();
  const [currentPost, setCurrentPost] = React.useState<string>();
  
  React.useEffect(() => {
	if (sismoCredentialClient && credentialInfoList) {
	  (async () => {
		const settleList = await Promise.allSettled(
		  credentialInfoList.map((reputationInfo) =>
			sismoCredentialClient.getSismoGroupInfo(reputationInfo.groupId)
		  )
		);
		const groupInfoList: SismoGroupInfo[] = [];
		settleList.map((elem) => {
		  if (elem.status === "fulfilled") {
			groupInfoList.push(elem.value);
		  }
		});
		setGroupInfoList(groupInfoList);
		console.log("groupInfoList:", groupInfoList);
	  })();
	}
  }, [credentialInfoList]);
  
  const sismoClaims: ClaimRequest[] = React.useMemo(() => {
	if (credentialInfoList) {
	  return credentialInfoList.map((credentialInfo: CredentialInfo) => {
		return {
		  groupId: credentialInfo.groupId,
		  isOptional: true,
		};
	  });
	} else {
	  return [];
	}
  }, [credentialInfoList]);
  
  React.useEffect(() => {
	if (address && sismoCredentialClient) {
	  getCredentialInfoList();
	}
  }, [address, sismoCredentialClient]);
  
  const connectWallet = async () => {
	const walletProvider = new WalletProvider();
	
	const {address} = await walletProvider.connectWallet(WALLET.METAMASK);
	setAddress(address);
	
	const provider = new ethers.providers.Web3Provider(walletProvider);
	const mSigner = provider.getSigner();
	setSigner(mSigner);
	const client = new SismoClient(mSigner);
	client.attach(process.env.SISMO_CREDENTIAL_CONTRACT!)
	
	setSismoCredentialClient(client);
	return mSigner;
  };
  
  const bindCredential = async () => {
	if (!responseBytes) {
	  throw new Error("responseBytes undefined!");
	}
	if (!address) {
	  throw new Error("Address undefined!");
	}
	
	const result = await sismoCredentialClient?.bindCredential({
	  accountAddress: address,
	  responseBytes,
	});
	console.log("singer: ", await signer.getAddress())
	console.log("bindCredential result:", result);
  };
  
  const getCredentialInfoList = async () => {
	if (!address) {
	  throw new Error("Address undefined!");
	}
	const result = await sismoCredentialClient?.getCredentialInfoList(address);
	console.log("getCredentialInfoList result:", result);
	setCredentialInfoList(result);
  };
  
  const getCredentialInfo = async () => {
	if (!address) {
	  throw new Error("Address undefined!");
	}
	const result = await sismoCredentialClient?.getCredentialInfo({
	  accountAddress: address,
	  groupId: "0x7cccd0183c6ca02e76600996a671a824",
	});
	console.log("getCredentialInfo result:", result);
  };
  
  const getGroupSetup = async () => {
	if (!address) {
	  throw new Error("Address undefined!");
	}
	const result = await sismoCredentialClient?.getGroupSetup(mockGroupId_01);
	console.log("getGroupSetup result:", result);
  };
  
  const createStream = async () => {
	await dataverseConnector.connectWallet({
	  wallet: WALLET.METAMASK,
	});
	
	const hasCapa = await dataverseConnector.runOS({
	  method: SYSTEM_CALL.checkCapability,
	  params: {
		appId: modelParser.appId,
	  },
	});
	if (!hasCapa) {
	  await dataverseConnector.runOS({
		method: SYSTEM_CALL.createCapability,
		params: {
		  appId: modelParser.appId,
		  resource: RESOURCE.CERAMIC,
		},
	  });
	}
	
	const date = new Date().toISOString();
	
	const encrypted = JSON.stringify({
	  text: false,
	  images: false,
	  videos: false,
	});
	
	const res = await dataverseConnector.runOS({
	  method: SYSTEM_CALL.createStream,
	  params: {
		modelId: modelParser.getModelByName("post").streams[0].modelId,
		streamContent: {
		  appVersion: "0.0.1",
		  text: "Hello, My name is Moon.",
		  images: [
			"https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link",
		  ],
		  videos: [],
		  createdAt: date,
		  updatedAt: date,
		  encrypted,
		},
	  },
	});
	
	console.log(res);
	setCurrentPost(res.streamContent.content.text);
  };
  
  const deployCredentialContract = async () => {
	const appId = "0x1267ea070ec44221e85667a731eee045"
	const SEVEN_DAYS = 60 * 60 * 24 * 7;
	const isImpersonationMode = false;
	const groups = [{groupId: "0xf44c3e70f9147f1a4d59077451535f00", startAt: 1000, duration: 60 * 60 * 24}]
	
	const deployer = new CredentialDeployer(signer!);
	const contractAddr = await deployer.deployCredential({
	  sismoAppId: appId,
	  duration: SEVEN_DAYS,
	  isImpersonationMode,
	  groupSetup: groups
	});
	console.log("credentialContractAddress:", contractAddr);
	setCredentialContractAddr(contractAddr)
  }
  
  const attachCredentialAddress = async () => {
	// const contractAddr = "0xeb7B157E02FC578917E44Fa76EE797a45Fd37F8c";
	if (!credentialContractAddr) {
	  throw new Error("credential contract not deployed");
	}
	sismoCredentialClient?.attach(credentialContractAddr)
  }
  
  
  return (
	<>
	  <button onClick={connectWallet}> connectWallet</button>
	  <br/>
	  {address ? abbreviateAddress(address) : undefined}
	  <br/>
	  <button onClick={getCredentialInfoList}> getCredentialInfoList</button>
	  <br/>
	  <Profile
		address={address}
		credentialInfoList={credentialInfoList}
		groupInfoList={groupInfoList}
	  />
	  <br/>
	  <SismoConnectButton
		disabled={address ? false : true}
		config={{
		  appId: process.env.SISMO_APP_ID!,
		}}
		auths={[{authType: AuthType.VAULT}]}
		claims={sismoClaims}
		signature={
		  address
			? {
			  message: abiCoder.encode(["address"], [address]),
			}
			: undefined
		}
		onResponseBytes={(responseBytes: string) => {
		  console.log("responseBytes:", responseBytes);
		  setResponseBytes(responseBytes);
		}}
	  />
	  <br/>
	  <button onClick={deployCredentialContract}> deployCredentialContract</button>
	  <br/>
	  <button onClick={attachCredentialAddress}> attachCredentialAddress</button>
	  <br/>
	  <button onClick={bindCredential}> bindCredential</button>
	  <br/>
	  <button onClick={getCredentialInfo}> getCredentialInfo</button>
	  <br/>
	  <button onClick={getGroupSetup}> getGroupSetup</button>
	  <br/>
	  <button onClick={createStream}> createStream</button>
	  <br/>
	  {currentPost && (
		<Post
		  address={address}
		  credentialInfoList={credentialInfoList}
		  groupInfoList={groupInfoList}
		  text={currentPost}
		/>
	  )}
	  <br/>
	  <button className="router" onClick={() => navigate("/admin")}>
		Go to Admin
	  </button>
	</>
  );
};

export {User};
