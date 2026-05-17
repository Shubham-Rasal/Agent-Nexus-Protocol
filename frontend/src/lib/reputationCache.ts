// Reputation scores are fetched from the Goldsky subgraph, not by scanning raw chain logs.
// The old fromBlock:"earliest" getLogs scan was reading the entire Filecoin Calibration chain
// history on every request, causing massive memory usage.

interface CacheEntry {
  score: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export async function getCachedReputationScore(agentId: string): Promise<number> {
  const now = Date.now();
  const entry = cache.get(agentId);
  if (entry && entry.expiresAt > now) return entry.score;

  // Default score — real scores come from the Goldsky reputation subgraph
  // via the /api/agents/[id] route when the drawer is opened.
  const score = 50;
  cache.set(agentId, { score, expiresAt: now + CACHE_TTL_MS });
  return score;
}
