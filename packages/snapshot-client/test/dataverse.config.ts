export const config = {
  name: "snapshot-client-demo", 
  logo: "https://bafybeifozdhcbbfydy2rs6vbkbbtj3wc4vjlz5zg2cnqhb2g4rm2o5ldna.ipfs.w3s.link/dataverse.svg",
  website: ["localhost:5173"], // you can use localhost:(port) for testing
  defaultFolderName: "Main",
  description: "This is snapshot client test demo.",
  models: [
    {
      isPublicDomain: false, // default
      schemaName: "proposal.graphql",
      encryptable: [], // strings within the schema and within the array represent fields that may be encrypted, while fields within the schema but not within the array represent fields that will definitely not be encrypted
    },
    {
      isPublicDomain: false, // default
      schemaName: "vote.graphql",
      encryptable: [], // strings within the schema and within the array represent fields that may be encrypted, while fields within the schema but not within the array represent fields that will definitely not be encrypted
    }
  ],
  ceramicUrl: null, // leave null to use dataverse test Ceramic node. Set to {Your Ceramic node Url} for mainnet, should start with "https://".
};
