import React, { useContext, useEffect, useState } from "react";
import "./App.scss";
import Client, {
  ChainId,
  Network,
  TablelandClient,
} from "@dataverse/tableland-client-toolkit";
import {
  CREATE_TABLE_SQL,
  INSERT_TABLE_SQL,
  UPDATE_TABLE_SQL,
} from "./constant";
import { SYSTEM_CALL, WALLET } from "@dataverse/dataverse-connector";
import { Context } from "./main";

const App = () => {
  const { dataverseConnector, walletProvider, modelParser } = useContext(Context);
  const [account, setAccount] = useState<string>();
  const [did, setDid] = useState<string>();
  const [network, setNetwork] = useState<Network>();
  const [client, setClient] = useState<Client>();
  const [createSql, setCreateSql] = useState<string>(CREATE_TABLE_SQL);
  const [insertSql, setInsertSql] = useState<string>(INSERT_TABLE_SQL);
  const [updateSql, setUpdateSql] = useState<string>(UPDATE_TABLE_SQL);
  const [createResTextarea, setCreateResTextarea] = useState<string>("");
  const [insertResTextarea, setInsertResTextarea] = useState<string>("");
  const [updateResTextarea, setUpdateResTextarea] = useState<string>("");
  const [tableId, setTableId] = useState<string>("");
  const [tableName, setTableName] = useState<string>("");
  const [tableTextarea, setTableTextarea] = useState<string>("");

  useEffect(() => {
    if (did) {
      const client = new Client({
        dataverseConnector,
        walletProvider,
        network: Network.MUMBAI,
        modelId: modelParser.getModelByName("table").streams[0].modelId,
      });
      setClient(client);
    }
  }, [did]);

  useEffect(() => {
    if (tableName) {
      setInsertSql(INSERT_TABLE_SQL.replace("test_table", tableName));
      setUpdateSql(UPDATE_TABLE_SQL.replace("test_table", tableName));
    }
  }, [tableName]);

  const connectIdentity = async () => {
    const { address, wallet } = await dataverseConnector.connectWallet();
    setAccount(address);
    console.log("address:", address);

    const did = await dataverseConnector.runOS({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId: modelParser.appId,
      },
    });
    setDid(did);
    console.log("did:", did);
  };

  const handleCreateTable = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    if (createSql.length === 0) {
      console.error("createSql empty");
      return;
    }
    try {
      const result = await client?.createTable(createSql);
      if (result) {
        setTableId(result.tableId);
        console.log(result);
        console.log(
          "real_table_name: ",
          `${result.tableName}_${result.chainId}_${result.tableId}`
        );
        setTableName(`${result.tableName}_${result.chainId}_${result.tableId}`);
        setCreateResTextarea(JSON.stringify(result));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleInsertTable = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    if (insertSql.length === 0) {
      console.error("mutateSql empty");
      return;
    }
    if (!tableId) {
      console.error("tableId empty");
      return;
    }
    try {
      console.log(insertSql);
      const result = await client?.mutateTable(tableId, insertSql);
      console.log("result:", result);
      if (result) {
        setInsertResTextarea(result.transactionHash);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTable = async () => {
    if (!account) {
      console.error("account undefined");
      return;
    }
    if (insertSql.length === 0) {
      console.error("mutateSql empty");
      return;
    }
    if (!tableId) {
      console.error("tableId empty");
      return;
    }
    try {
      console.log(updateSql);
      const result = await client?.mutateTable(tableId, updateSql);
      console.log("result:", result);
      if (result) {
        setUpdateResTextarea(result.transactionHash);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGetTableByTableId = async () => {
    const tableName = await client?.getTableNameById(tableId);
    if (tableName) {
      const result = await client?.getTableByName(tableName);
      console.log("result:", result);
      setTableTextarea(JSON.stringify(result));
    } else {
      console.error("getTableNameById failed");
    }
  };

  const selectNetwork = async (network: Network) => {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ChainId[network] }],
    })
    setNetwork(network);
  };

  const getTableList = async () => {
    const tables = await (client as Client).getTableList();
    console.log("tables: ", tables);
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

      <div className="app-body">
        <div className="network-select">
          <button
            disabled={(account ? false : true) || network === Network.MUMBAI}
            onClick={() => selectNetwork(Network.MUMBAI)}
          >
            {network !== Network.MUMBAI
              ? "Switch Network to Mumbai"
              : "Mumbai Connected"}
          </button>
          <button
            disabled={
              (account ? false : true) || network === Network.HYPER_SPACE
            }
            onClick={() => selectNetwork(Network.HYPER_SPACE)}
          >
            {network !== Network.HYPER_SPACE
              ? "Switch Network to HyperSpace"
              : "HyperSpace Connected"}
          </button>
        </div>
        <div className="test-item">
          <button
            disabled={account && network ? false : true}
            onClick={handleCreateTable}
            className="block"
          >
            CreateTable
          </button>
          <div className="title">CREATE SQL</div>
          <input
            type="text"
            value={createSql}
            onChange={(event) => setCreateSql(event.target.value)}
          />
          <div className="title">Create Result</div>
          <div className="textarea">{createResTextarea}</div>
        </div>
        <div className="test-item">
          <button
            disabled={account && network ? false : true}
            onClick={handleInsertTable}
            className="block"
          >
            InsertTable
          </button>
          <div className="title">MUTATE SQL</div>
          <input
            type="text"
            value={insertSql}
            onChange={(event) => setInsertSql(event.target.value)}
          />
          <div className="title">Insert Result(TransactionHash)</div>
          <div className="textarea">{insertResTextarea}</div>
        </div>
        <div className="test-item">
          <button
            disabled={account && network ? false : true}
            onClick={handleUpdateTable}
            className="block"
          >
            UpdateTable
          </button>
          <div className="title">UPDATE SQL</div>
          <input
            type="text"
            value={updateSql}
            onChange={(event) => setInsertSql(event.target.value)}
          />
          <div className="title">Update Result(TransactionHash)</div>
          <div className="textarea">{updateResTextarea}</div>
        </div>
        <div className="test-item">
          <button onClick={handleGetTableByTableId} className="block">
            GetTableByTableId
          </button>
          <div className="title">Table ID</div>
          <input
            type="text"
            value={tableId}
            onChange={(event) => setTableId(event.target.value)}
          />
          <div className="title">Table</div>
          <div className="textarea">{tableTextarea}</div>
        </div>
        <hr />
        <button onClick={() => getTableList()}> listStreams</button>
      </div>
    </div>
  );
};

export default App;
