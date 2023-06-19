import "./App.scss";
import { useContext, useEffect, useMemo, useState } from "react";
import { Currency, WALLET } from "@dataverse/runtime-connector";
import { Context } from "./main";
import Client from "@dataverse/lens-client-toolkit";

const App = () => {
  const { runtimeConnector } = useContext(Context);
  const lensClient = useMemo(() => {
    return new Client({
      runtimeConnector: runtimeConnector,
    });
  }, []);
  const [account, setAccount] = useState<string>();
  const [did, setDid] = useState<string>();
  const [lensProfiles, setLensProfiles] = useState<string>("");
  const [handle, setHandle] = useState<string>();
  const [createLensProfileRes, setCreateLensProfileRes] = useState<string>("");

  useEffect(() => {
    getProfiles();
  }, [account]);

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
    const profileId = await lensClient.createLensProfile(handle);
    console.log("res:", profileId);
    setCreateLensProfileRes(profileId);
  };

  const getProfiles = async () => {
    if (account) {
      const res = await lensClient.getLensProfiles(account);
      console.log("[getLensProfiles]res:", res);
      setLensProfiles(JSON.stringify(res));
    }
  };

  const getProfileIdByName = async () => {
    // const res = await lensClient.getProfileIdByName()
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
          <div className="title">Profiles</div>
          <div className="textarea">{lensProfiles}</div>
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
            onChange={(event) => setHandle(event.target.value)}
          />
          <div className="title">Profile Id</div>
          <div className="textarea">{createLensProfileRes}</div>
        </div>
        <div className="test-item"></div>
      </div>
    </div>
  );
};

export default App;
