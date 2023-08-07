import {
  DataverseConnector,
  StreamContent,
  SYSTEM_CALL,
} from "@dataverse/dataverse-connector";
import { Database, helpers, Validator } from "@tableland/sdk";
import { ChainId, TablelandContract, TransferEventSig } from "./constant";
import { Network } from "./types";
import { BigNumberish, ethers } from "ethers";
import { Checker } from "@dataverse/utils-toolkit";
import { WalletProvider } from "@dataverse/wallet-provider";

export class TablelandClient {
  dataverseConnector: DataverseConnector;
  walletProvider: WalletProvider;
  network: Network;
  modelId: string;
  private checker: Checker;

  constructor({
    dataverseConnector,
    walletProvider,
    network,
    modelId,
  }: {
    dataverseConnector: DataverseConnector;
    walletProvider: WalletProvider;
    network: Network;
    modelId: string;
  }) {
    this.dataverseConnector = dataverseConnector;
    this.walletProvider = walletProvider;
    this.checker = new Checker(dataverseConnector);
    this.network = network;
    this.modelId = modelId;
  }

  public async createTable(
    sql: string
  ): Promise<
    { tableName: string; chainId: number; tableId: string } | undefined
  > {
    await this.checker.checkCapability();

    const tableOwner = this.dataverseConnector.address!;
    const chainId = ChainId[this.network];
    const createTableRegex = /CREATE TABLE (\w+) \((.+)\)/;
    const result = createTableRegex.exec(sql);
    const tableName = result ? result[1] : "";
    const columns = result ? result[2] : "";

    const statement = `CREATE TABLE ${tableName}_${chainId} (${columns})`;
    const params = this._getCreateParams(tableOwner, statement);
    /* tablename, chainId, colums, */
    try {
      const res = await this.walletProvider.contractCall(params);
      const tableId = await this.getTableIdByTxHash(res.transactionHash);

      const tableContent = {
        tableId: tableId,
        table_name: `${tableName}_${chainId}_${tableId}`,
        create_sql: statement,
        chainId: chainId,
        columns: columns,
        created_at: new Date().toISOString(),
      };
      await this._persistTable(this.modelId, tableContent);

      return {
        tableName,
        chainId,
        tableId,
      };
    } catch (e) {
      console.error(e);
      return;
    }
  }

  public async getTableList() {
    await this.checker.checkCapability();

    const streams = await this._loadTableStreams();
    const tables = await this._fetchTables(streams);
    return tables;
  }

  public async mutateTable(tId: string, sql: string) {
    this.checker.checkWallet();

    const tableOwner = this.dataverseConnector.address!;

    const params = this._getMutateParams(tableOwner, tId, sql);
    const res = await this.walletProvider.contractCall(params);

    return res;
  }

  public async getTableNameById(id: string) {
    const chainId = ChainId[this.network];
    const db = new Database({
      baseUrl: helpers.getBaseUrl(chainId),
    });
    const obj = new Validator(db.config);

    const { name } = await obj.getTableById({
      chainId: chainId,
      tableId: id,
    });
    return name;
  }

  public async buildTableNameInSQL(id: string) {
    const chainId = ChainId[this.network];
    const db = new Database({
      baseUrl: helpers.getBaseUrl(chainId),
    });
    const obj = new Validator(db.config);

    const { name } = await obj.getTableById({
      chainId: chainId,
      tableId: id,
    });
    return name;
  }

  async getTableByName(tableName: string) {
    const db = new Database({
      baseUrl: helpers.getBaseUrl(80001),
    });
    const { results } = await db.prepare(`SELECT * FROM ${tableName};`).all();
    return results;
  }

  async getTableIdByTxHash(transactionHash: string) {
    this.checker.checkWallet();

    await this.walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ChainId[this.network] }],
    });
    const res = await this.walletProvider.request({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    })
    let tableId: string | undefined;
    res.logs.forEach((log: any) => {
      if (log.topics[0] == TransferEventSig) {
        const abiCoder = new ethers.utils.AbiCoder();
        const tokenId = abiCoder.decode(["uint256"], log.topics[3]);
        tableId = tokenId.toString();
      }
    });
    if (tableId) {
      return tableId;
    } else {
      throw new Error("Unable to got tableId");
    }
  }

  private async _loadTableStreams() {
    const { wallet } = (await this.dataverseConnector.getCurrentWallet())!;
    this.dataverseConnector.connectWallet({ wallet });

    const pkh = this.dataverseConnector.getCurrentPkh();
    return await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.loadStreamsBy,
      params: {
        modelId: this.modelId,
        pkh: pkh,
      },
    });
  }

  private async _fetchTables(streams: any) {
    const chainId = ChainId[this.network];
    const db = new Database({
      baseUrl: helpers.getBaseUrl(chainId),
    });
    const obj = new Validator(db.config);
    const tables: any[] = [];
    for (const key in streams) {
      // loop through the RecordType
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        const tableId = streams[key].streamContent.content.tableId;
        const { name, schema } = await obj.getTableById({
          chainId: chainId,
          tableId: tableId,
        });
        tables.push({
          name: name,
          schema: schema,
          ...streams[key].streamContent.content,
        });
      }
    }
    return tables;
  }

  private _getCreateParams(owner: string, statement: string) {
    return {
      contractAddress: TablelandContract[this.network],
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "string",
              name: "statement",
              type: "string",
            },
          ],
          name: "create",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
      ],
      method: "create",
      params: [owner, statement],
    };
  }
  private _getMutateParams(
    caller: string,
    tableId: BigNumberish,
    statement: string
  ) {
    return {
      contractAddress: TablelandContract[this.network],
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "caller",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tableId",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "statement",
              type: "string",
            },
          ],
          name: "mutate",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ],
      method: "mutate",
      params: [caller, tableId, statement],
    };
  }

  private async _persistTable(modelId: string, streamContent: StreamContent) {
    await this.dataverseConnector.runOS({
      method: SYSTEM_CALL.createStream,
      params: {
        modelId,
        streamContent,
      },
    });
  }
}
