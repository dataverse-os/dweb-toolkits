import {gql, GraphQLClient} from "graphql-request";
import {GRAPHQL_API} from "../snapshot-client/constants";
import {GetActionParams, GetProposalsParams} from "./types";

export const client = new GraphQLClient(`${GRAPHQL_API.dev}`, {
    headers: {
      "x-api-key": "",
    }
  }
);

export const getActions = async (variables: GetActionParams) => {
  const query = gql`query {
  messages (
    first: ${variables.first}
    skip:  ${variables.skip ?? 0}
    where: { space: "${variables.space}" }
    orderBy: "mci"
    orderDirection: ${variables.orderDirection}
  ) {
    id
    address
    ipfs
    receipt
    type
    mci
  }
}
`

  const res: any = await client.request(query);
  console.log("messages: ", res.messages)
}

export const getVoteDetail = async (voteId: string) => {
  const query = gql`query {
  vote (
    id: "${voteId}"
  ) {
    id
    voter
    vp
    vp_by_strategy
    vp_state
    created
    proposal {
      id
    }
    choice
    space {
      id
    }
  }
}`

  const res: any = await client.request(query);
  console.log("messages: ", res.messages)

}

export const getProposals = async (variables: GetProposalsParams) => {
  console.log("variables: ", variables);
  const query = gql`query {
  proposals (
    first: ${variables.first},
    skip: ${variables.skip ?? 0},
    where: {
      space_in: ["${variables.space}"],
      state: "${variables.state}"
    },
    orderBy: "created",
    orderDirection: ${variables.orderDirection}
  ) {
    id
    title
    body
    choices
    start
    end
    snapshot
    state
    scores
    scores_by_strategy
    scores_total
    scores_updated
    author
    space {
      id
      name
    }
  }
}`;
  const res: any = await client.request(query);
  console.log("messages: ", res.proposals)
  return res.proposals;
}

export const getProposalById = async (proposalId: string) => {
  const query = gql`query {
  proposal(id:"${proposalId}") {
    id
    title
    body
    choices
    start
    end
    snapshot
    state
    author
    created
    scores
    scores_by_strategy
    scores_total
    scores_updated
    plugins
    network
    strategies {
      name
      network
      params
    }
    space {
      id
      name
    }
  }
}`

  const res: any = await client.request(query);
  console.log("res: ", res.proposal);
  return res.proposal
}

export const getSpaceDetail = async (space: string) => {
  const query = gql`query {
  space(id: "${space}") {
    id
    name
    about
    network
    symbol
    members
  }
}`

  const res: any = await client.request(query);
  console.log("res: ", res.space);
  return res.space
}