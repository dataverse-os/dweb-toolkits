import {GraphQLClient} from "graphql-request";
import {GetActionParams, GetProposalsParams} from "./types";
import {GRAPHQL} from "../constants";
import {QueryActions, QueryProposalById, QueryProposals, QuerySpaceDetail, QueryVoteDetail} from "./graphql-query";


export class GraphqlApi {
  private apiKey: string | undefined;
  public apiUrl: string;
  public graphqlClient: GraphQLClient

  constructor({apiUrl, apiKey}: { apiUrl: string, apiKey?: string }) {
    this.apiUrl = `${apiUrl}/${GRAPHQL}`;
    this.apiKey = apiKey;
    this.graphqlClient = new GraphQLClient(`${this.apiUrl}`, {
      headers: {
        "x-api-key": this.apiKey ?? "",
      }
    })
  }

  async getActions(variables: GetActionParams) {
    const res: any = await this.graphqlClient.request(QueryActions, {... variables});
    console.log("messages: ", res.messages)
    return res.messages;
  }

  async getVoteDetail(voteId: string) {
    const res: any = await this.graphqlClient.request(QueryVoteDetail, {id: voteId});
    console.log("messages: ", res.messages)
    return res.messages;
  }

  async getProposals(variables: GetProposalsParams) {
    console.log("variables: ", variables);
    const res: any = await this.graphqlClient.request(QueryProposals, {... variables});
    console.log("messages: ", res.proposals)
    return res.proposals;
  }

  async getProposalById(proposalId: string) {
    const res: any = await this.graphqlClient.request(QueryProposalById, {id: proposalId});
    console.log("res: ", res.proposal);
    return res.proposal
  }

  async getSpaceDetail(space: string) {
    const res: any = await this.graphqlClient.request(QuerySpaceDetail, {id: space});
    console.log("res: ", res.space);
    return res.space
  }
}