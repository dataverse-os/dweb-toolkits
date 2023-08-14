import {gql} from "graphql-request";

export const QuerySpaceDetail = gql`query ($id: String) {
  space(id: $id) {
    id
    name
    about
    network
    symbol
    members
  }
}
`;

export const QueryActions = gql`
  query ($first: Int, $skip: Int, $space: String, $orderDirection: OrderDirection) {
    messages(first: $first, skip: $skip, where: {space: $space}, orderBy: "mci", orderDirection: $orderDirection) {
      id
      address
      ipfs
      receipt
      type
      mci
    }
  }
`

export const QueryVoteDetail = gql`
  query ($id: String) {
    vote(id: $id) {
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
  }
`

export const QueryProposals = gql`
  query ($first: Int, $skip: Int, $state: String, $space: String, $orderDirection: OrderDirection) {
    proposals(first: $first, skip: $skip, where: {space_in: [$space], state: $state}, orderBy: "created", orderDirection: $orderDirection) {
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
  }
`

export const QueryProposalById = gql`
  query ($id: String) {
    proposal(id: $id) {
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
  }
`