export enum Network {
    FILE_COIN = "Filecoin",
    HYPER_SPACE = "HyperSpace",
    MUMBAI = "Mumbai",
    POLYGON = "Polygon"
}

export type TableContent = {
    tableId: string,
    table_name: string,
    create_sql: string,
    chainId: number,
    columns: string,
    created_at: string;
}
