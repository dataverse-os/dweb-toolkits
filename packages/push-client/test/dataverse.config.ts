export const config = {
  name: "push-client-demo", 
  logo: "https://bafybeifozdhcbbfydy2rs6vbkbbtj3wc4vjlz5zg2cnqhb2g4rm2o5ldna.ipfs.w3s.link/dataverse.svg",
  website: ["localhost:5173"], // you can use localhost:(port) for testing
  defaultFolderName: "Main",
  description: "This is push client test demo.",
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
/*     {
      isPublicDomain: false, // default
      schemaName: "chatuser.graphql",
      encryptable: []
    }, */
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
