import "./App.scss";
import { useContext, useEffect, useMemo, useState } from "react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";
import Client, {
  CommentData,
  LensNetwork,
  MirrorData,
  ModelType,
} from "@dataverse/lens-client-toolkit";
import { getCurrencyAddress } from "./utils";
import { ethers } from "ethers";

const modelIds = {
  [ModelType.Post]: import.meta.env.VITE_POST_MODEL_ID,
  [ModelType.Collection]: import.meta.env.VITE_COLLECTION_MODEL_ID,
};

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const lensClient = useMemo(() => {
    return new Client({
      modelIds: modelIds,
      runtimeConnector: runtimeConnector,
      network: LensNetwork.MumbaiTestnet,
    });
  }, []);
  const [account, setAccount] = useState<string>();
  const [did, setDid] = useState<string>();
  const [collectModule, setCollectModule] = useState<string>();
  const [collectModuleWhitelistStatus, setCollectModuleWhitelistStatus] =
    useState<boolean>();
  const [followModule, setFollowModule] = useState<string>();
  const [followModuleWhitelistStatus, setFollowModuleWhitelistStatus] =
    useState<boolean>();
  const [referenceModule, setReferenceModule] = useState<string>();
  const [referenceModuleWhitelistStatus, setReferenceModuleWhitelistStatus] =
    useState<boolean>();
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
  const [commentRes, setCommentRes] = useState<string>("");
  const [mirrorRes, setMirrorRes] = useState<string>("");
  const [profileIdPointed, setProfileIdPointed] = useState<string>("0x80e4");
  const [pubIdPointed, setPubIdPointed] = useState<string>("0x10");

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

  const getCollectModule = async () => {
    if (!profileId || !pubId) {
      return;
    }
    const res = await lensClient.getCollectModule({
      profileId,
      pubId,
    });
    console.log("[getCollectModule]res:", res);
    setCollectModule(res);
  };

  const getFollowModule = async () => {
    if (!profileId) {
      return;
    }
    const res = await lensClient.getFollowModule(profileId);
    console.log("[getFollowModule]res:", res);
    setFollowModule(res);
  };

  const getReferenceModule = async () => {
    if (!profileId || !pubId) {
      return;
    }
    const res = await lensClient.getReferenceModule({
      profileId,
      pubId,
    });
    console.log("[getReferenceModule]res:", res);
    setReferenceModule(res);
  };

  const isCollectModuleWhitelisted = async () => {
    if (!collectModule) {
      return;
    }
    const res = await lensClient.isCollectModuleWhitelisted(collectModule);
    console.log("[isCollectModuleWhitelisted]res:", res);
    setCollectModuleWhitelistStatus(res);
  };

  const isFollowModuleWhitelisted = async () => {
    if (!followModule) {
      return;
    }
    const res = await lensClient.isFollowModuleWhitelisted(followModule);
    console.log("[isFollowModuleWhitelisted]res:", res);
    setFollowModuleWhitelistStatus(res);
  };

  const isReferenceModuleWhitelisted = async () => {
    if (!referenceModule) {
      return;
    }
    const res = await lensClient.isReferenceModuleWhitelisted(referenceModule);
    console.log("[isReferenceModuleWhitelisted]res:", res);
    setReferenceModuleWhitelistStatus(res);
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
    if (!profileId) {
      return;
    }
    const res = await lensClient.burnProfile(profileId);
    console.log("[burnProfile]res:", res);
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
    console.log("[createFreeCollectPost]res:", res);
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
    console.log("[createFreeCollectPostWithSig]res:", res);
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
    console.log("[createRevertCollectPost]res:", res);
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
    console.log("[createRevertCollectPostWithSig]res:", res);
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
    console.log("[createFeeCollectPost]res:", res);
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
    console.log("[createFeeCollectPostWithSig]res:", res);
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
    console.log("[collect]res:", res);
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
    console.log("[collectWithSig]res:", res);
    setCollectRes(JSON.stringify(res));
  };

  const comment = async () => {
    if (!profileId || !profileIdPointed || !pubIdPointed) {
      return;
    }
    const referenceModule = await lensClient.getReferenceModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    });
    // followerOnly: false
    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [false]
    ) as any;
    const collectModule = await lensClient.getCollectModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    })
    
    const commentData: CommentData = {
      profileId,
      contentURI: "https://github.com/dataverse-os",
      profileIdPointed,
      pubIdPointed,
      referenceModuleData: [],
      collectModule,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData: [],
    };
    const res = await lensClient.comment(commentData);
    console.log("[comment]res:", res);
    setCommentRes(JSON.stringify(res));
  };

  const commentWithSig = async () => {
    if (!profileId || !profileIdPointed || !pubIdPointed) {
      return;
    }
    const referenceModule = await lensClient.getReferenceModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    });
    // followerOnly: false
    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["bool"],
      [false]
    ) as any;
    const collectModule = await lensClient.getCollectModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    })
    
    const commentData: CommentData = {
      profileId,
      contentURI: "https://github.com/dataverse-os",
      profileIdPointed,
      pubIdPointed,
      referenceModuleData: [],
      collectModule,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData: [],
    };
    const res = await lensClient.commentWithSig(commentData);
    console.log("[commentWithSig]res:", res);
    setCommentRes(JSON.stringify(res));
  };

  const mirror = async () => {
    if (!profileId || !profileIdPointed || !pubIdPointed) {
      return;
    }
    const referenceModule = await lensClient.getReferenceModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    });
    const mirrorData: MirrorData = {
      profileId,
      profileIdPointed,
      pubIdPointed,
      referenceModuleData: [],
      referenceModule,
      referenceModuleInitData: [],
    };
    const res = await lensClient.mirror(mirrorData);
    console.log("[mirror]res:", res);
    setMirrorRes(JSON.stringify(res));
  };

  const mirrorWithSig = async () => {
    if (!profileId || !profileIdPointed || !pubIdPointed) {
      return;
    }
    const referenceModule = await lensClient.getReferenceModule({
      profileId: profileIdPointed,
      pubId: pubIdPointed,
    });
    const mirrorData: MirrorData = {
      profileId,
      profileIdPointed,
      pubIdPointed,
      referenceModuleData: [],
      referenceModule,
      referenceModuleInitData: [],
    };
    const res = await lensClient.mirrorWithSig(mirrorData);
    console.log("[mirrorWithSig]res:", res);
    setMirrorRes(JSON.stringify(res));
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
    console.log("[getSigNonce]res:", nonce);
  };

  const getPersistedPosts = async () => {
    const res = await lensClient.getPersistedPosts();
    console.log("[getPersistedPosts]res:", res);
  }

  const getPersistedCollections = async () => {
    const res = await lensClient.getPersistedCollections();
    console.log("[getPersistedCollections]res:", res);
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
          {/* CollectModule */}
          <button
            disabled={profileId && pubId ? false : true}
            onClick={getCollectModule}
          >
            getCollectModule
          </button>
          <button
            disabled={collectModule ? false : true}
            onClick={isCollectModuleWhitelisted}
          >
            isCollectModuleWhitelisted
          </button>
          <div className="title">{`Collect Module(isWhitelisted:${collectModuleWhitelistStatus})`}</div>
          <input
            type="text"
            value={collectModule || ""}
            onChange={(event) => setCollectModule(event.target.value)}
          />
          {/* FollowModule */}
          <button disabled={profileId ? false : true} onClick={getFollowModule}>
            getFollowModule
          </button>
          <button
            disabled={followModule ? false : true}
            onClick={isFollowModuleWhitelisted}
          >
            isFollowModuleWhitelisted
          </button>
          <div className="title">{`Follow Module(isWhitelisted:${followModuleWhitelistStatus})`}</div>
          <input
            type="text"
            value={followModule || ""}
            onChange={(event) => setFollowModule(event.target.value)}
          />
          {/* ReferenceModule */}
          <button
            disabled={profileId && pubId ? false : true}
            onClick={getReferenceModule}
          >
            getReferenceModule
          </button>
          <button
            disabled={referenceModule ? false : true}
            onClick={isReferenceModuleWhitelisted}
          >
            isReferenceModuleWhitelisted
          </button>
          <div className="title">{`Reference Module(isWhitelisted:${referenceModuleWhitelistStatus})`}</div>
          <input
            type="text"
            value={referenceModule || ""}
            onChange={(event) => setReferenceModule(event.target.value)}
          />
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
        </div>
        <div className="test-item">
          <button onClick={getSigNonce} className="block">
            getSigNonce
          </button>
          <button
            disabled={account ? false : true}
            onClick={createFreeCollectPost}
            className="block"
          >
            createFreeCollectPost
          </button>
          <button
            disabled={account ? false : true}
            onClick={createFreeCollectPostWithSig}
            className="block"
          >
            createFreeCollectPostWithSig
          </button>
          <button
            disabled={account ? false : true}
            onClick={createRevertCollectPost}
            className="block"
          >
            createRevertCollectPost
          </button>
          <button
            disabled={account ? false : true}
            onClick={createRevertCollectPostWithSig}
            className="block"
          >
            createRevertCollectPostWithSig
          </button>
          <button
            disabled={account ? false : true}
            onClick={createFeeCollectPost}
            className="block"
          >
            createFeeCollectPost
          </button>
          <button
            disabled={account ? false : true}
            onClick={createFeeCollectPostWithSig}
            className="block"
          >
            createFeeCollectPostWithSig
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
          <button
            disabled={profileId && pubId ? false : true}
            onClick={collectWithSig}
            className="block"
          >
            collectWithSig
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

        <div className="test-item">
          <button
            disabled={
              profileId && profileIdPointed && pubIdPointed ? false : true
            }
            onClick={comment}
            className="block"
          >
            comment
          </button>
          <button
            disabled={
              profileId && profileIdPointed && pubIdPointed ? false : true
            }
            onClick={commentWithSig}
            className="block"
          >
            commentWithSig
          </button>
          <div className="title">ProfileIdPointed</div>
          <input
            type="text"
            value={profileIdPointed || ""}
            onChange={(event) => setProfileIdPointed(event.target.value)}
          />
          <div className="title">PubIdPointed</div>
          <input
            type="text"
            value={pubIdPointed || ""}
            onChange={(event) => setPubIdPointed(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{commentRes}</div>
        </div>

        <div className="test-item">
          <button
            disabled={
              profileId && profileIdPointed && pubIdPointed ? false : true
            }
            onClick={mirror}
            className="block"
          >
            mirror
          </button>
          <button
            disabled={
              profileId && profileIdPointed && pubIdPointed ? false : true
            }
            onClick={mirrorWithSig}
            className="block"
          >
            mirrorWithSig
          </button>
          <div className="title">ProfileIdPointed</div>
          <input
            type="text"
            value={profileIdPointed || ""}
            onChange={(event) => setProfileIdPointed(event.target.value)}
          />
          <div className="title">PubIdPointed</div>
          <input
            type="text"
            value={pubIdPointed || ""}
            onChange={(event) => setPubIdPointed(event.target.value)}
          />
          <div className="title">Result</div>
          <div className="textarea">{mirrorRes}</div>
        </div>

        <div className="test-item">
          <button
            disabled={did ? false : true}
            onClick={getPersistedPosts}
            className="block"
          >
            getPersistedPosts
          </button>
          <button
            disabled={did ? false : true}
            onClick={getPersistedCollections}
            className="block"
          >
            getPersistedCollections
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
