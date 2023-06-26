export const config = {
    slug: "lens_toolkit_test03", // app id, need to match this regular: `^[a-zA-Z][a-zA-Z0-9_]*$`
    name: "lens_toolkit_test03", // app name should NOT contain "-"
    logo: "http://no-logo.com",
    website: "", // you can use localhost:(port) for testing
    defaultFolderName: "Untitled",
    description: "",
    models: [
      {
        isPublicDomain: false, // default
        schemaName: "lenspost.graphql",
        encryptable: [], // strings within the schema and within the array represent fields that may be encrypted, while fields within the schema but not within the array represent fields that will definitely not be encrypted
      },
      {
        isPublicDomain: false, // default
        schemaName: "lenscollection.graphql",
        encryptable: [], // strings within the schema and within the array represent fields that may be encrypted, while fields within the schema but not within the array represent fields that will definitely not be encrypted
      },
    ],
    ceramicUrl: null, // leave null to use dataverse test Ceramic node. Set to {Your Ceramic node Url} for mainnet, should start with "https://".
  };
  