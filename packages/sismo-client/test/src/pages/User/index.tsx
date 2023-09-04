import React from "react";
import {
  AuthType,
  ClaimRequest,
  SismoConnectButton,
} from "@sismo-core/sismo-connect-react";
import { ethers } from "ethers";
import {
  CredentialInfo,
  SismoGroupInfo,
  SismoClient,
} from "@dataverse/sismo-client";
import { Profile } from "../../components";
import { abiCoder } from "../../utils";
import { useNavigate } from "react-router-dom";

const mockGroupId_01 = "0x4350b6e49eb734978ec285e740f54848";
// const mockGroupId_02 = "0xaa329246800f36e70eefbc38c7bb018e";

const User = () => {
  const navigate = useNavigate();
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialClient, setSismoCredentialClient] =
    React.useState<SismoClient>();

  const [credentialInfoList, setCredentialInfoList] =
    React.useState<CredentialInfo[]>();
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
  
  const getCredentialInfo = async () => {
    if (!address) {
      throw new Error("Address undefined!");
    }
    const result = await sismoCredentialClient?.getCredentialInfo({
      accountAddress: address,
      groupId: "0x7cccd0183c6ca02e76600996a671a824"
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
      <button className="router" onClick={() => navigate("/admin")}>
        Go to Admin
      </button>
    </>
  );
};

export { User };
