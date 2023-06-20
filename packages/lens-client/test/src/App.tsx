import "./App.scss";
import { useContext, useEffect, useMemo, useState } from "react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";
import Client, { LENS_CONTRACTS_ADDRESS } from "@dataverse/lens-client-toolkit";
import { getCurrencyAddress } from "./utils";
import JsonFile from "./LensHub.json";
import { BigNumber, Contract, ethers } from "ethers";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const lensClient = useMemo(() => {
    return new Client({
      runtimeConnector: runtimeConnector,
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
    if (did) {
      console.log("start test mint...");
      lensClient.testMint();
    }
  }, [did]);

  const testWithEthers = async () => {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);

    // The MetaMask plugin also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, you need the account signer...
    const signer = provider.getSigner();

    const lensHub = new Contract(
      "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
      JsonFile.abi,
      signer
    );

    const tx = await lensHub.setFollowModule(
      BigNumber.from("0x023a"),
      "0x8c822Fc029EBdE62Da1Ed1072534c5e112dAE48c",
      []
    );
    // const tx = await lensHub.setFollowModule(
    //   BigNumber.from("0x023"),
    //   "0x8c822Fc029EBdE62Da1Ed1072534c5e112dAE48c",
    //   []
    // );
    console.log("tx:", tx);
    const res = await tx.wait();
    console.log("res:", res);
  };

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
    if (!handle) {
      return;
    }
    if (!/^[\da-z]{5,26}$/.test(handle) || handle.length > 26) {
      throw "Only supports lower case characters, numbers, must be minimum of 5 length and maximum of 26 length";
    }
    const profileId = await lensClient.createProfile(handle);
    setCreateLensProfileRes(profileId);
  };

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

      <button onClick={testWithEthers}>
        TestWithEthers
      </button>

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
          <div className="title">FeeFollowModule</div>
          <input
            type="text"
            disabled
            value={LENS_CONTRACTS_ADDRESS.FeeFollowModule}
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
          <div className="title">Pub Id</div>
          <input
            type="text"
            onChange={(event) => setPubId(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{collectRes}</div>
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
      </div>
    </div>
  );
};

export default App;
