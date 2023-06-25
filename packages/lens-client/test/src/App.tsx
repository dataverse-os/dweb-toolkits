import "./App.scss";
import { useContext, useEffect, useMemo, useState } from "react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";
import Client, { LensNetwork } from "@dataverse/lens-client-toolkit";
import { getCurrencyAddress } from "./utils";
import { BigNumber, Contract, ethers } from "ethers";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const lensClient = useMemo(() => {
    return new Client({
      runtimeConnector: runtimeConnector,
      network: LensNetwork.MumbaiTestnet,
    });
  }, []);
  const [account, setAccount] = useState<string>();
  const [did, setDid] = useState<string>();
  const [profiles, setProfiles] = useState<string>("");
  const [profileId, setProfileId] = useState<string>();
  const [getProfileRes, setGetProfileRes] = useState<string>("");
  const [handle, setHandle] = useState<string>();
  const [createLensProfileRes, setCreateLensProfileRes] = useState<string>("");
  const [getProfileIdByHandleRes, setGetProfileIdByHandleRes] =
    useState<string>();
  const [collectNFT, setCollectNFT] = useState<string>();
  const [collector, setCollector] = useState<string>();
  const [createPostRes, setCreatePostRes] = useState<string>("");
  const [pubId, setPubId] = useState<string>();
  const [collectRes, setCollectRes] = useState<string>();
  const [isCollectedRes, setIsCollectedRes] = useState<string>();

  useEffect(() => {
    if (account) {
      getProfiles();
    }
  }, [account]);

  useEffect(() => {
    if (profiles.length > 0) {
      console.log("profiles: ", profiles);
      setProfileId(JSON.parse(profiles)[0].id);
    }
  }, [profiles]);

  // const testWithEthers = async () => {
  //   const provider = new ethers.providers.Web3Provider(
  //     (window as any).ethereum
  //   );

  //   // MetaMask requires requesting permission to connect users accounts
  //   await provider.send("eth_requestAccounts", []);

  //   // The MetaMask plugin also allows signing transactions to
  //   // send ether and pay to change state within the blockchain.
  //   // For this, you need the account signer...
  //   const signer = provider.getSigner();

  //   const lensHub = new Contract(
  //     "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
  //     JsonFile.abi,
  //     signer
  //   );

  //   const tx = await lensHub.createProfile({
  //     to: "0xD0167B1cc6CAb1e4e7C6f38d09EA35171d00b68e",
  //     handle: "canvas2",
  //     imageURI:
  //       "https://gateway.ipfscdn.io/ipfs/QmQPuXJ7TTg7RpNjHeAR4NrGtDVSAwoP2qD4VdZF2vAJiR",
  //     followModule: "0x0000000000000000000000000000000000000000",
  //     followModuleInitData: [],
  //     followNFTURI: "https://github.com/dataverse-os",
  //   });
  //   console.log("tx:", tx);
  //   const res = await tx.wait();
  //   console.log("res:", res);
  // };

  const connectIdentity = async () => {
    const { address, wallet } = await lensClient.runtimeConnector.connectWallet(
      WALLET.METAMASK
    );
    console.log({ address });
    setAccount(address);
    const did = await lensClient.runtimeConnector.createCapability({
      wallet,
      app: import.meta.env.VITE_APP_NAME,
    });
    setDid(did);
    console.log("connected");
  };

  const createProfile = async () => {
    if (!account || !handle) {
      return;
    }
    if (!/^[\da-z]{5,26}$/.test(handle) || handle.length > 26) {
      throw "Only supports lower case characters, numbers, must be minimum of 5 length and maximum of 26 length";
    }
    const res = await lensClient.createProfile({
      to: account,
      handle,
      imageURI:
        "https://gateway.ipfscdn.io/ipfs/QmQPuXJ7TTg7RpNjHeAR4NrGtDVSAwoP2qD4VdZF2vAJiR",
    });
    setCreateLensProfileRes(JSON.stringify(res));
  };

  const burnProfile = async () => {
    if(!profileId) {
      return;
    }
    const res = await lensClient.burnProfile(profileId);
    console.log("[burnProfile]res:", res);
  }

  const getProfiles = async () => {
    if (account) {
      const res = await lensClient.getProfiles(account);
      console.log("[getprofiles]res:", res);
      setProfiles(JSON.stringify(res));
    }
  };

  const getProfile = async () => {
    if (!profileId) {
      return;
    }
    const res = await lensClient.getProfile(profileId);
    console.log("[getProfile]res:", res);
    setGetProfileRes(JSON.stringify(res));
  };

  const getProfileIdByHandle = async () => {
    if (!handle) {
      return;
    }
    const res = await lensClient.getProfileIdByHandle(handle);
    console.log("[getProfileIdByHandle]res:", res);
    setGetProfileIdByHandleRes(JSON.stringify(res));
  };

  const setFeeFollowModule = async () => {
    if (!profileId || !account) {
      return;
    }
    await lensClient.setFeeFollowModule({
      profileId,
      moduleInitParams: {
        amount: 10e10,
        currency: getCurrencyAddress(Currency.WMATIC),
        recipient: account,
      },
    });
  };

  const setRevertFollowModule = async () => {
    if (!profileId || !account) {
      return;
    }
    const res = await lensClient.setRevertFollowModule(profileId);
    console.log("[setRevertFollowModule]res:", res);
  };

  const createFreeCollectPost = async () => {
    if (!profileId) {
      return;
    }
    const res = await lensClient.createFreeCollectPost({
      profileId,
      contentURI: "https://github.com/dataverse-os",
      collectModuleInitParams: {
        followerOnly: false,
      },
    });
    setCreatePostRes(JSON.stringify(res));
  };

  const createRevertCollectPost = async () => {
    if (!profileId) {
      return;
    }
    const res = await lensClient.createRevertCollectPost({
      profileId,
      contentURI: "https://github.com/dataverse-os",
    });
    setCreatePostRes(JSON.stringify(res));
  };

  const createRevertCollectPostWithSig = async () => {
    if (!profileId) {
      return;
    }
    const res = await lensClient.createRevertCollectPostWithSig({
      profileId,
      contentURI: "https://github.com/dataverse-os",
    });
    setCreatePostRes(JSON.stringify(res));
  };

  const createFeeCollectPost = async () => {
    if (!account || !profileId) {
      return;
    }
    const res = await lensClient.createFeeCollectPost({
      profileId,
      contentURI: "https://github.com/dataverse-os",
      collectModuleInitParams: {
        amount: 10e8,
        currency: getCurrencyAddress(Currency.WMATIC),
        recipient: account,
        referralFee: 0,
        followerOnly: false,
      },
    });
    setCreatePostRes(JSON.stringify(res));
  };

  const createFeeCollectPostWithSig = async () => {
    if (!account || !profileId) {
      return;
    }
    const res = await lensClient.createFeeCollectPostWithSig({
      profileId,
      contentURI: "https://github.com/dataverse-os",
      collectModuleInitParams: {
        amount: 10e8,
        currency: getCurrencyAddress(Currency.WMATIC),
        recipient: account,
        referralFee: 0,
        followerOnly: false,
      },
    });
    setCreatePostRes(JSON.stringify(res));
  };

  const createFreeCollectPostWithSig = async () => {
    if (!account || !profileId) {
      return;
    }

    const res = await lensClient.createFreeCollectPostWithSig({
      profileId,
      contentURI: "https://github.com/dataverse-os",
      collectModuleInitParams: {
        followerOnly: false,
      },
    });

    setCreatePostRes(JSON.stringify(res));
  };

  const collect = async () => {
    if (!profileId || !pubId) {
      return;
    }
    const res = await lensClient.collect({
      profileId,
      pubId,
    });
    setCollectRes(JSON.stringify(res));
  };

  const collectWithSig = async () => {
    if (!profileId || !pubId) {
      return;
    }
    const res = await lensClient.collectWithSig({
      profileId,
      pubId,
    });
    setCollectRes(JSON.stringify(res));
  };

  const getCollectNFT = async () => {
    if (!profileId || !pubId) {
      return;
    }
    const collectNFT = await lensClient.getCollectNFT({
      profileId,
      pubId,
    });
    setCollectNFT(collectNFT);
  };

  const isCollected = async () => {
    if (!collectNFT || !collector) {
      return;
    }
    const res = await lensClient.isCollected({
      collectNFT,
      collector,
    });
    console.log("[isCollected]res:", res);
    setIsCollectedRes(JSON.stringify(res));
  };

  const getSigNonce = async () => {
    const nonce = await lensClient.getSigNonce();
  }

  return (
    <div id="App">
      <div className="app-header">
        <div className="account-did">
          <div className="account border-shape">
            {`account: ${account || ""}`}
          </div>
          <div className="did border-shape">{`did: ${did || ""}`}</div>
        </div>
        <div className="connect-identity">
          <button onClick={connectIdentity}>Connect Identity</button>
        </div>
      </div>

      <div className="app-body">
        <div className="test-item">
          <button
            disabled={account ? false : true}
            onClick={getProfiles}
            className="block"
          >
            getProfiles
          </button>
          <div className="title">Profiles</div>
          <div className="textarea">{profiles}</div>
        </div>
        <div className="test-item">
          <button
            disabled={profileId ? false : true}
            onClick={getProfile}
            className="block"
          >
            getProfile
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{getProfileRes}</div>
        </div>
        <div className="test-item">
          <button
            disabled={handle ? false : true}
            onClick={createProfile}
            className="block"
          >
            createProfile
          </button>
          <div className="title">Handle(Nick Name)</div>
          <input
            type="text"
            value={handle || ""}
            onChange={(event) => setHandle(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{createLensProfileRes}</div>
        </div>
        <div className="test-item">
          <button
            disabled={profileId ? false : true}
            onClick={burnProfile}
            className="block"
          >
            burnProfile
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
        </div>
        <div className="test-item">
          <button
            disabled={handle ? false : true}
            onClick={getProfileIdByHandle}
            className="block"
          >
            getProfileIdByHandle
          </button>
          <div className="title">Handle(Nick Name)</div>
          <input
            type="text"
            value={handle || ""}
            onChange={(event) => setHandle(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{getProfileIdByHandleRes}</div>
        </div>
        <div className="test-item">
          <button
            disabled={profileId && account ? false : true}
            onClick={setFeeFollowModule}
            className="block"
          >
            setFeeFollowModule
          </button>
          <button
            disabled={profileId && account ? false : true}
            onClick={setRevertFollowModule}
            className="block"
          >
            setRevertFollowModule
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
          {/* <div className="title">Result</div>
          <div className="textarea">{getProfileIdByHandleRes}</div> */}
        </div>
        <div className="test-item">
          <button onClick={createFreeCollectPost} className="block">
            createFreeCollectPost
          </button>
          <button onClick={createRevertCollectPost} className="block">
            createRevertCollectPost
          </button>
          <button onClick={createFeeCollectPost} className="block">
            createFeeCollectPost
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{createPostRes}</div>
        </div>
        <div className="test-item">
          <button
            disabled={profileId && pubId ? false : true}
            onClick={collect}
            className="block"
          >
            collect
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
          <div className="title">PubId</div>
          <input
            type="text"
            value={pubId || ""}
            onChange={(event) => setPubId(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{collectRes}</div>
        </div>
        <div className="test-item">
          <button
            disabled={profileId && pubId ? false : true}
            onClick={getCollectNFT}
            className="block"
          >
            getCollectNFT
          </button>
          <div className="title">ProfileId</div>
          <input
            type="text"
            value={profileId || ""}
            onChange={(event) => setProfileId(event.target.value)}
          />
          <div className="title">PubId</div>
          <input
            type="text"
            value={pubId || ""}
            onChange={(event) => setPubId(event.target.value)}
          />
          <div className="title">Result (CollectNFT address)</div>
          <div className="textarea">{collectNFT}</div>
        </div>
        <div className="test-item">
          <button
            disabled={collectNFT && collector ? false : true}
            onClick={isCollected}
            className="block"
          >
            isCollected
          </button>
          <div className="title">CollectNFT</div>
          <input
            type="text"
            onChange={(event) => setCollectNFT(event.target.value)}
          />
          <div className="title">Collector</div>
          <input
            type="text"
            onChange={(event) => setCollector(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{isCollectedRes}</div>
        </div>
        <button onClick={getSigNonce} className="block">
          getSigNonce
        </button>
        <button onClick={createFeeCollectPostWithSig} className="block">
          createFeeCollectPostWithSig
        </button>
        <button onClick={createFreeCollectPostWithSig} className="block">
          createFreeCollectPostWithSig
        </button>
        <button onClick={createRevertCollectPostWithSig} className="block">
          createRevertCollectPostWithSig
        </button>
        <button onClick={collectWithSig} className="block">
          collectWithSig
        </button>
      </div>
    </div>
  );
};

export default App;
