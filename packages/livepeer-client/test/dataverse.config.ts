export const config = {
  name: "livepeer-client-demo", 
  logo: "https://bafybeifozdhcbbfydy2rs6vbkbbtj3wc4vjlz5zg2cnqhb2g4rm2o5ldna.ipfs.w3s.link/dataverse.svg",
  website: ["localhost:5173"], // you can use localhost:(port) for testing
  defaultFolderName: "Main",
  description: "This is livepeer client test demo.",
  models: [
    {
      isPublicDomain: false, // default
      schemaName: "livepeer-asset.graphql",
      encryptable: ["storage", "playback_id"]
    }
  ],
  ceramicUrl: null, // leave null to use dataverse test Ceramic node. Set to {Your Ceramic node Url} for mainnet, should start with "https://".
};
