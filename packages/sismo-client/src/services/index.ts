import { SismoGroupInfo } from "../types";
import ApolloClient, { gql } from "apollo-boost";

const client = new ApolloClient({
  uri: "https://api.sismo.io/",
});

export const querySismoGroupInfoById = async (groupId: string) => {
  const query = gql`
    query getGroupFromId($groupId: ID) {
      group(id: $groupId) {
        id
        latestSnapshot {
          id
          group {
            id
            name
            description
            specs
            generationFrequency
          }
          timestamp
          size
          valueDistribution {
            value
            numberOfAccounts
          }
          dataUrl
        }
        snapshots {
          id
          timestamp
          size
          dataUrl
        }
        name
        description
        specs
        generationFrequency
      }
    }
  `;

  const response = await (client as any).query({
    query,
    variables: { groupId },
  });
  return response.data.group as SismoGroupInfo;
};

