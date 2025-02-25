import MarketMakerHookABI from './abis/MarketMakerHook.json';

// Export ABIs
export const ABIs = {
  MarketMakerHook: MarketMakerHookABI
};

// Contract addresses (update these with your deployed contract addresses)
export const ContractAddresses = {
  MarketMakerHook: '0xb74eBC7E97AAddbDBeD4A9427B8383B223FeCA80'
};

// For type-safe contract interactions
export type MarketMakerHookContract = {
  // You can define the methods you'll use most frequently here
  // Or use a typechain-generated type if you're using typechain
};