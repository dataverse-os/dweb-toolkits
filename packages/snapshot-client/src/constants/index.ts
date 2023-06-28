export const GRAPHQL = "graphql";

export enum SNAP_SHOT_HUB {
  prod = "https://hub.snapshot.org",
  dev = "https://testnet.snapshot.org",
}

export const now = () => {
  return Number((new Date().getTime() / 1000).toFixed(0));
};

export const ERR_ONLY_SPACE_AUTHORS_CAN_PROPOSE = "only space authors can propose"

export const ERR_WRONG_PROPOSAL_FORMAT = "wrong proposal format"