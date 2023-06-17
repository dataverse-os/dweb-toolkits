export const config = {
    slug: "", // app id, need to match this regular: `^[a-zA-Z][a-zA-Z0-9_]*$`
    name: "", // app name should NOT contain "-"
    logo: "",
    website: "", // you can use localhost:(port) for testing
    defaultFolderName: "Untitled",
    description: "",
    models: [
        {
            isPublicDomain: false, // default
            schemaName: "livepeerasset.graphql",
            encryptable: ["storage", "playback_id", "playback_url", "download_url"]
        }
        /*dataverse.config.ts*/
    ],
    ceramicUrl: null, // leave null to use dataverse test Ceramic node. Set to {Your Ceramic node Url} for mainnet, should start with "https://".
};
