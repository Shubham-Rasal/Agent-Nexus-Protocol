import { NextRequest, NextResponse } from "next/server";
import { getRegisteredAgents } from "@/lib/subgraph";
import agentsData from "@/app/agents.json";

// Lookup map: agentId → stored name/description from agents.json
const storedAgents = new Map(
  (agentsData.agents as any[]).map((a) => [String(a.agentId ?? a.id), a])
);

interface CachedPage { agents: unknown[]; expiresAt: number }
const pageCache = new Map<string, CachedPage>();
const CACHE_TTL = 60_000;

function staticAgents() {
  return (agentsData.agents as any[]).map((a) => ({
    id: a.id,
    agentId: a.agentId,
    owner: a.owner,
    agentURI: a.agentURI,
    contractId: a.contractId,
    registeredAt: a.registeredAt,
    name: a.name,
    description: a.description,
    reputationScore: a.reputationScore ?? 50,
  }));
}

// Agents that aren't registered on-chain (e.g., local demo agents) — always prepended.
function localAgents() {
  return (agentsData.agents as any[])
    .filter((a) => a.contractId === "local")
    .map((a) => ({
      id: a.id,
      agentId: a.agentId,
      owner: a.owner,
      agentURI: a.agentURI,
      contractId: a.contractId,
      registeredAt: a.registeredAt,
      name: a.name,
      description: a.description,
      reputationScore: a.reputationScore ?? 50,
    }));
}

async function refreshCache(cacheKey: string, pageSize: number, skip: number) {
  try {
    const registered = await getRegisteredAgents(pageSize, skip);
    const onChain = registered.map((entry) => {
      const stored = storedAgents.get(String(entry.agentId));
      return {
        id: entry.agentId,
        agentId: entry.agentId,
        owner: entry.owner,
        agentURI: entry.agentURI,
        contractId: entry.contractId_,
        registeredAt: new Date(Number(entry.timestamp_) * 1000).toISOString(),
        name: stored?.name || `Agent #${entry.agentId}`,
        description: stored?.description || "",
        reputationScore: 50,
      };
    });
    const agents = [...localAgents(), ...onChain];
    pageCache.set(cacheKey, { agents, expiresAt: Date.now() + CACHE_TTL });
  } catch {
    // subgraph unavailable — cached static fallback stays in place
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "50"), 100);
  const skip = (page - 1) * pageSize;

  const cacheKey = `${page}:${pageSize}`;
  const cached = pageCache.get(cacheKey);

  if (cached) {
    // Stale-while-revalidate: return immediately, refresh in background if expired
    if (cached.expiresAt <= Date.now()) {
      refreshCache(cacheKey, pageSize, skip);
    }
    return NextResponse.json({ agents: cached.agents, page, pageSize, total: cached.agents.length });
  }

  // Cold start: seed cache with static data immediately, kick off background refresh
  const localFirst = localAgents();
  const staticIds = new Set(localFirst.map(a => String(a.agentId)));
  const fallback = [
    ...localFirst,
    ...staticAgents().filter(a => !staticIds.has(String(a.agentId))),
  ];
  pageCache.set(cacheKey, { agents: fallback, expiresAt: Date.now() + CACHE_TTL });
  refreshCache(cacheKey, pageSize, skip);
  return NextResponse.json({ agents: fallback, page, pageSize, total: fallback.length });
}
