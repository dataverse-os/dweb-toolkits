import React from "react";
import {
  AuthType,
  ClaimRequest,
  SismoConnectButton,
  SismoConnectConfig,
} from "@sismo-core/sismo-connect-react";
import { ethers } from "ethers";
import {
  ReputationInfo,
  SismoGroupInfo,
  SismoClient,
} from "@dataverse/sismo-client";
import { Profile } from "../../components";
import { abiCoder } from "../../utils";
import { useNavigate } from "react-router-dom";

const sismoConnectConfig: SismoConnectConfig = {
  appId: "0x1267ea070ec44221e85667a731eee045",
};
const AUTHS = [{ authType: AuthType.VAULT }];
const MULTI_CLAIMS: ClaimRequest[] = [
  {
    groupId: "0x7cccd0183c6ca02e76600996a671a824", // CY Group1
    isOptional: true,
  },
  {
    groupId: "0xf44c3e70f9147f1a4d59077451535f00", // CY Group2
    isOptional: true,
  },
  {
    groupId: "0xaa329246800f36e70eefbc38c7bb018e", // Yf Cy Access
    isOptional: true,
  },
  {
    groupId: "0xb3ac412738ed399acab21fbda9add42c",
    isOptional: true,
  },
];

const User = () => {
  const navigate = useNavigate();
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialClient, setSismoCredentialClient] =
    React.useState<SismoClient>();

  const [credentialInfoList, setCredentialInfoList] =
    React.useState<ReputationInfo[]>();
  const [groupInfoList, setGroupInfoList] = React.useState<SismoGroupInfo[]>();
  const [responseBytes, setResponseBytes] = React.useState<string>();

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

  React.useEffect(() => {
    if (address && sismoCredentialClient) {
      getCredentialInfoList();
    }
  }, [address, sismoCredentialClient]);

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert("Please install metamask first!");
    }
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );

    const [address] = await provider.send("eth_requestAccounts", []);
    setAddress(address);

    const signer = provider.getSigner();

    const client = new SismoClient({
      contractAddr: process.env.SISMO_CREDENTIAL_CONTRACT!,
      signer,
    });

    setSismoCredentialClient(client);
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

  return (
    <>
      <button onClick={connectWallet}> connectWallet</button>
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
        config={sismoConnectConfig}
        auths={AUTHS}
        claims={MULTI_CLAIMS}
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
      <button className="router" onClick={() => navigate("/admin")}>
        Go to Admin
      </button>
    </>
  );
};

export { User };
