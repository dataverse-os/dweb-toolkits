export enum OrderDirection {
  asc = "asc",
  desc = "desc"
}

export enum State {
  closed = "closed",
  active = "active"
}

export type GetActionParams = {
  space: string
} & Pagination

export type GetProposalsParams = {
  space: string
  state: State
} & Pagination

export type Pagination = {
  first: number,
  skip?: number
  orderDirection: OrderDirection
}