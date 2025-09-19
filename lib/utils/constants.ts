import { type Chain, defineChain } from "viem";

export const mocaDevnet: Chain & {
  contracts: { multicall3: { address: `0x${string}`; blockCreated: number } };
} = defineChain({
  id: 5151,
  name: "Moca Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Moca Network",
    symbol: "MOCA",
  },
  rpcUrls: {
    default: {
      http: ["https://devnet-rpc.mocachain.org"],
      webSocket: ["wss://devnet-rpc.mocachain.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Moca Chain Explorer",
      url: "https://devnet-scan.mocachain.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 3837540,
    },
  },
} as const);

export const mocaTestnet: Chain & {
  contracts: { multicall3: { address: `0x${string}`; blockCreated: number } };
} = defineChain({
  id: 5151,
  name: "Moca Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Moca Network",
    symbol: "MOCA",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.mocachain.org"],
      webSocket: ["wss://testnet-rpc.mocachain.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Moca Chain Explorer",
      url: "https://testnet-scan.mocachain.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 3837540,
    },
  },
} as const);
