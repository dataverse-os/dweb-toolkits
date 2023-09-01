import React from "react";
import { ethers } from "ethers";
import { GroupSetup, SismoClient } from "@dataverse/sismo-client";
import { abbreviateAddress } from "../../utils";
import { useNavigate } from "react-router-dom";

const mockGroupId_01 = "0x4350b6e49eb734978ec285e740f54848";
const mockGroupId_02 = "0xaa329246800f36e70eefbc38c7bb018e";

const Admin = () => {
  const navigate = useNavigate();
  const [address, setAddress] = React.useState<string>();
  const [sismoCredentialClient, setSismoCredentialClient] =
    React.useState<SismoClient>();

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert("Please install metamask first!");
    }
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum,
    );

    const [address] = await provider.send("eth_requestAccounts", []);
    setAddress(address);

    const signer = provider.getSigner();

    const client = new SismoClient({
      contractAddr: "0xaf61e05CCa3197D74EE059a02be281Ed6b90203F",
      signer,
    });

    setSismoCredentialClient(client);
  };

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

    const result = await sismoCredentialClient?.addDataGroups(dataGroups);
    console.log("addDataGroups result:", result);
  };

  const deleteDataGroups = async () => {
    if (!address) {
      throw new Error("Address undefined!");
    }

    const dataGroups = [mockGroupId_01, mockGroupId_02];
    const result = await sismoCredentialClient?.deleteDataGroups(dataGroups);
    console.log("deleteDataGroups result:", result);
  };

  return (
    <>
      <button onClick={connectWallet}> connectWallet</button>
      <br />
      {address ? abbreviateAddress(address) : undefined}
      <br />
      <button onClick={addDataGroups}> addDataGroups</button>
      <br />
      <button onClick={deleteDataGroups}> deleteDataGroups</button>
      <br />
      <button className='router' onClick={() => navigate("/user")}>
        Go To User
      </button>
      <br />
    </>
  );
};

export { Admin };
