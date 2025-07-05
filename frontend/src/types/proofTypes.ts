export interface Provider {
  owner: string;
  pdpUrl: string;
  // Add other provider fields as needed
}

export interface Root {
  rootId: string;
  timestamp: string;
  rootCid: string;
}

export interface ProofSetDetails {
  pdpUrl?: string;
  roots?: Root[];
  // Add other proof set detail fields as needed
}

export interface ProofSet {
  pdpVerifierProofSetId: number;
  payee: string;
  details: ProofSetDetails | null;
  pdpUrl: string | null;
  provider: Provider | null;
}

export interface ProofSetsResponse {
  proofsets: ProofSet[];
} 