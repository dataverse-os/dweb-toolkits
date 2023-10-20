import React from "react";
import {
  AuthType,
  ClaimRequest,
  SismoConnectButton,
} from "@sismo-core/sismo-connect-react";
import { ethers, Signer } from "ethers";
import {
  CredentialInfo,
  SismoGroupInfo,
  SismoCredentialUserClient,
  SismoCredentialFactoryClient,
} from "@dataverse/sismo-client";
import { Post, Profile } from "../../components";
import { abbreviateAddress, abiCoder } from "../../utils";
import { useNavigate } from "react-router-dom";
import {
  DataverseConnector,
  RESOURCE,
  SYSTEM_CALL,
  WALLET,
} from "@dataverse/dataverse-connector";
import { WalletProvider } from "@dataverse/wallet-provider";
import { ModelParser } from "@dataverse/model-parser";
import appJson from "../../../output/app.json";

const mockGroupId_01 = "0x4350b6e49eb734978ec285e740f54848";
// const fackGroupId = "0x4350b6e49eb734978ec285e740f54841";
const modelParser = new ModelParser(appJson);
const dataverseConnector = new DataverseConnector();

const User = () => {
  const navigate = useNavigate();
  const [signer, setSigner] = React.useState<Signer>();
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialFactoryClient, setSismoCredentialFactoryClient] =
    React.useState<SismoCredentialFactoryClient>();
  const [credentialContractAddr, setCredentialContractAddr] =
    React.useState<string>(process.env.SISMO_CREDENTIAL_CONTRACT!);

  const [credentialInfoList, setCredentialInfoList] =
    React.useState<CredentialInfo[]>();
  const [groupInfoList, setGroupInfoList] = React.useState<SismoGroupInfo[]>();
  const [responseBytes, setResponseBytes] = React.useState<string>();
  const [currentPost, setCurrentPost] = React.useState<string>();

  const sismoCredentialClient = React.useMemo(() => {
    if (signer) {
      return new SismoCredentialUserClient(signer, credentialContractAddr);
    } else {
      return;
    }
  }, [credentialContractAddr, signer]);

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

    const { address } = await walletProvider.connectWallet({ wallet: WALLET.METAMASK });
    setAddress(address);

    const provider = new ethers.providers.Web3Provider(walletProvider);
    const _signner = provider.getSigner();
    setSigner(_signner);

    const factoryClient = new SismoCredentialFactoryClient(
      _signner,
      process.env.SISMO_CREDENTIAL_FACTORY_CONTRACT!
    );

    setSismoCredentialFactoryClient(factoryClient);
  };

  const createSismoCredential = async () => {
    if(!sismoCredentialFactoryClient) {
      return;
    }
    const SEVEN_DAYS = 60 * 60 * 24 * 7;
    const isImpersonationMode = false;
    const groups = [
      {
        groupId: "0xf44c3e70f9147f1a4d59077451535f00",
        startAt: 1000,
        duration: 60 * 60 * 24,
      },
    ];

    const contractAddr = await sismoCredentialFactoryClient.deploySismoCredential({
      sismoAppId: process.env.SISMO_APP_ID!,
      duration: SEVEN_DAYS,
      isImpersonationMode,
      groupSetup: groups,
    });
    console.log("credentialContractAddress:", contractAddr);
    setCredentialContractAddr(contractAddr);
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

  const createPostWithCredential = async () => {
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
      method: SYSTEM_CALL.createIndexFile,
      params: {
        modelId: modelParser.getModelByName("post").streams[0].modelId,
        fileContent: {
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
    setCurrentPost(res.fileContent.content.text);
  };

  return (
    <>
      <button onClick={connectWallet}> connectWallet</button>
      <br />
      {address ? abbreviateAddress(address) : undefined}
      <br />
      <button onClick={createSismoCredential}>
        createSismoCredential
      </button>
      <br />
      <button onClick={getCredentialInfoList}> getCredentialInfoList</button>
      <br />
      <Profile
        address={address}
        credentialInfoList={credentialInfoList}
        groupInfoList={groupInfoList}
      />
      <br />
      <SismoConnectButton
        disabled={address ? false : true}
        config={{
          appId: process.env.SISMO_APP_ID!,
        }}
        auths={[{ authType: AuthType.VAULT }]}
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
      <br />
      <button onClick={bindCredential}> bindCredential</button>
      <br />
      <button onClick={getCredentialInfo}> getCredentialInfo</button>
      <br />
      <button onClick={getGroupSetup}> getGroupSetup</button>
      <br />
      <button onClick={createPostWithCredential}> createPostWithCredential</button>
      <br />
      {currentPost && (
        <Post
          address={address}
          credentialInfoList={credentialInfoList}
          groupInfoList={groupInfoList}
          text={currentPost}
        />
      )}
      <br />
      <button className="router" onClick={() => navigate("/admin")}>
        Go to Admin
      </button>
    </>
  );
};

export { User };
