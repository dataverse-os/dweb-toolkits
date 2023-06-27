
export const GRAPHQL = "graphql"
export const SNAP_SHOT_HUB = {
  "prod": 'https://hub.snapshot.org',
  "dev": 'https://testnet.snapshot.org'
};

export const now = () => {
  return Number((new Date().getTime() / 1000).toFixed(0));
}