export interface ANPAgentCard {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
  name: string;
  description: string;
  image?: string;
  active: boolean;
  x402Support: boolean;
  supportedTrust: ("reputation" | "crypto-economic" | "tee-attestation")[];
  services: {
    name: "web" | "A2A" | "MCP" | "OASF" | "ENS" | "DID" | "email";
    endpoint: string;
    version?: string;
  }[];

  // ANP-specific extensions
  anp: {
    systemPrompt: string;
    tools: string[];
    knowledge_sources: string[];
    privacy_level: "low" | "medium" | "high" | "critical";
    stake: number;
  };
}

// Shape returned by the sync engine (subgraph + metadata merged)
export interface ANPAgent {
  agentId: string;
  owner: string;
  agentURI: string;
  createdAt: string;
  totalFeedback: number;
  // From registration file (off-chain metadata)
  name: string;
  description: string;
  active: boolean;
  systemPrompt?: string;
  tools?: string[];
  knowledge_sources?: string[];
  privacy_level?: string;
  stake?: number;
  // Computed reputation
  reputationScore?: number;
}
