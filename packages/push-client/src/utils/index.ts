export const getICAPAddress = (address: string, chainId: number = 5) => {
  return `eip155:${chainId}:${address}`;
};
