import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const filecoinCalibrationChain = defineChain({
  id: 314159,
  name: "Filecoin Calibration",
  nativeCurrency: { name: "testnet FIL", symbol: "tFIL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.calibration.node.glif.io/rpc/v1"] },
  },
  blockExplorers: {
    default: { name: "Filscan", url: "https://calibration.filscan.io" },
  },
  testnet: true,
});

// Contract addresses — updated after deployment
// These fall back to the canonical ERC-8004 addresses already on Calibration
export const CONTRACT_ADDRESSES = {
  IdentityRegistry: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ||
    "0xb610b8dcb4056e75246ece0829096bb2e807a858") as `0x${string}`,
  ReputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY ||
    "0x6550fbf4eb085d5a8370f3e19904df81f76854f9") as `0x${string}`,
};

export const IDENTITY_REGISTRY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "setAgentURI",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "Registered",
    type: "event",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
    ],
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "NewFeedback",
    type: "event",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "clientAddress", type: "address", indexed: true },
      { name: "feedbackIndex", type: "uint64", indexed: false },
      { name: "value", type: "int128", indexed: false },
      { name: "valueDecimals", type: "uint8", indexed: false },
      { name: "indexedTag1", type: "string", indexed: true },
      { name: "tag1", type: "string", indexed: false },
      { name: "tag2", type: "string", indexed: false },
      { name: "endpoint", type: "string", indexed: false },
      { name: "feedbackURI", type: "string", indexed: false },
      { name: "feedbackHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const publicClient = createPublicClient({
  chain: filecoinCalibrationChain,
  transport: http(),
});

// Server-side signer for the reputation API route
export function getSignerWalletClient() {
  const pk = process.env.REPUTATION_SIGNER_PRIVATE_KEY;
  if (!pk) throw new Error("REPUTATION_SIGNER_PRIVATE_KEY not set");
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({ account, chain: filecoinCalibrationChain, transport: http() });
}
