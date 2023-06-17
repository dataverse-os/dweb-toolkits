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
            schemaName: "channel.graphql",
            encryptable: []
        },
        {
            isPublicDomain: false, // default
            schemaName: "chatmessage.graphql",
            encryptable: ["link", "cid"],
        },
        {
            isPublicDomain: false, // default
            schemaName: "chatuser.graphql",
            encryptable: []
        },
        {
            isPublicDomain: false, // default
            schemaName: "notification.graphql",
            encryptable: []
        },
        {
            isPublicDomain: false, // default
            schemaName: "chatgpgkey.graphql",
            encryptable: ["pgp_key"]
        }
    ],
    ceramicUrl: null, // leave null to use dataverse test Ceramic node. Set to {Your Ceramic node Url} for mainnet, should start with "https://".
};
