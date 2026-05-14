import { publicClient, CONTRACT_ADDRESSES, REPUTATION_REGISTRY_ABI } from "./contracts";
import { type FeedbackEntry, computeReputationScore } from "./subgraph";

interface CacheEntry {
  score: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

// keccak256("NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32)")
const NEW_FEEDBACK_TOPIC =
  "0x20f55ad3ba1cacbdce607c9aa01dc10519b1b665473d86df9260de40d8f359a6" as `0x${string}`;

export async function getCachedReputationScore(agentId: string): Promise<number> {
  const now = Date.now();
  const entry = cache.get(agentId);
  if (entry && entry.expiresAt > now) return entry.score;

  try {
    // Pad agentId to 32 bytes for topic filter
    const agentIdHex = `0x${BigInt(agentId).toString(16).padStart(64, "0")}` as `0x${string}`;

    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.ReputationRegistry,
      event: {
        type: "event",
        name: "NewFeedback",
        inputs: REPUTATION_REGISTRY_ABI.find((x) => x.name === "NewFeedback")!.inputs as any,
      },
      args: { agentId: BigInt(agentId) } as any,
      fromBlock: "earliest",
      toBlock: "latest",
    });

    const feedbacks: FeedbackEntry[] = (logs as any[]).map((log) => ({
      value: BigInt(log.args?.value ?? 0),
      valueDecimals: Number(log.args?.valueDecimals ?? 0),
      tag1: log.args?.tag1 ?? "",
      isRevoked: false, // revoked events would need a separate getLogs call
    }));

    const score = computeReputationScore(feedbacks);
    cache.set(agentId, { score, expiresAt: now + CACHE_TTL_MS });
    return score;
  } catch {
    return entry?.score ?? 50;
  }
}
