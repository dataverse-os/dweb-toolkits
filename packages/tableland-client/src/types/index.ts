// import { StatementType } from "@tableland/sdk/src/helpers/parser";

enum Network {
    FILE_COIN = "Filecoin",
    HYPER_SPACE = "HyperSpace",
    MUMBAI = "Mumbai",
    POLYGON = "Polygon"
}

// export interface ExtractedStatement {
//     /**
//      * SQL statement string.
//      */
//     sql: string;
//     /**
//      * List of table names referenced within the statement.
//      */
//     tables: string[];
//     /**
//      * The statement type. Must be one of "read", "write", "create", or "acl".
//      */
//     type: StatementType;
// }
enum ModelName {
    TABLE = "table",
}

type ModelRecord = Record<ModelName, string>;

export {
    Network,
    ModelName,
    ModelRecord
}

export type TableContent = {
    tableId: string,
    table_name: string,
    create_sql: string,
    chainId: number,
    columns: string,
    created_at: string;
}
