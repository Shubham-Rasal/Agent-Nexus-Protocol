// Goldsky subgraph URL — raw event index for ERC-8004 IdentityRegistry on Filecoin Calibration
// Schema: raw events (registereds, metadataSets, uriupdateds, etc.)
const IDENTITY_SUBGRAPH_URL =
  "https://api.goldsky.com/api/public/project_cmmaf9dwcfw7s01zc9s19e8xf/subgraphs/erc8004-identity-registry-filecoin-testnet/1.0.0/gn";

async function gql<T>(url: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Subgraph HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export interface SubgraphRegistered {
  id: string;
  agentId: string;
  agentURI: string;
  owner: string;
  timestamp_: string;
  contractId_: string;
}

// Fetch Registered events (newest first).
// No contractId_ filter — returns agents from all ERC-8004 identity registries on Calibration.
export async function getRegisteredAgents(first = 50, skip = 0): Promise<SubgraphRegistered[]> {
  const data = await gql<{ registereds: SubgraphRegistered[] }>(
    IDENTITY_SUBGRAPH_URL,
    `query GetRegistered($first: Int!, $skip: Int!) {
      registereds(first: $first, skip: $skip, orderBy: timestamp_, orderDirection: desc) {
        id
        agentId
        agentURI
        owner
        timestamp_
        contractId_
      }
    }`,
    { first, skip }
  );
  return data.registereds;
}

// Fetch agent card JSON from a URI (supports ipfs:// and https://)
export async function fetchAgentCard(uri: string): Promise<Record<string, unknown> | null> {
  if (!uri) return null;
  try {
    let url = uri;
    if (uri.startsWith("ipfs://")) {
      url = `https://w3s.link/ipfs/${uri.slice(7)}`;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Compute a 0–100 reputation score from raw on-chain feedback values.
// values are encoded as (int128 value, uint8 valueDecimals) pairs.
export interface FeedbackEntry {
  value: bigint;
  valueDecimals: number;
  tag1: string;
  isRevoked: boolean;
}

export function computeReputationScore(feedbacks: FeedbackEntry[]): number {
  const active = feedbacks.filter((f) => !f.isRevoked);
  if (active.length === 0) return 50;
  const sum = active.reduce((acc, f) => {
    return acc + Number(f.value) / Math.pow(10, f.valueDecimals);
  }, 0);
  return Math.round(Math.min(100, Math.max(0, sum / active.length)));
}
