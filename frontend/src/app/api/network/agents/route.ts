import { NextRequest, NextResponse } from "next/server";
import { getRegisteredAgents, fetchAgentCard } from "@/lib/subgraph";
import { getCachedReputationScore } from "@/lib/reputationCache";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "50"), 100);
  const skip = (page - 1) * pageSize;

  try {
    const registered = await getRegisteredAgents(pageSize, skip);

    const agents = await Promise.all(
      registered.map(async (entry) => {
        // Fetch off-chain agent card metadata
        const card = await fetchAgentCard(entry.agentURI);

        // Compute on-chain reputation score
        let reputationScore = 50;
        try {
          reputationScore = await getCachedReputationScore(entry.agentId);
        } catch {
          // non-fatal
        }

        // ANP-specific extensions live inside card.anp (if registered via ANP)
        const anp = (card?.anp as Record<string, unknown>) ?? {};

        return {
          id: entry.agentId,
          agentId: entry.agentId,
          owner: entry.owner,
          agentURI: entry.agentURI,
          contractId: entry.contractId_,
          registeredAt: new Date(Number(entry.timestamp_) * 1000).toISOString(),
          reputationScore,
          // From agent card
          name: (card?.name as string) || `Agent #${entry.agentId}`,
          description: (card?.description as string) || "",
          active: (card?.active as boolean) ?? true,
          x402Support: (card?.x402Support as boolean) ?? false,
          services: (card?.services as unknown[]) ?? [],
          // ANP extensions
          systemPrompt: (anp.systemPrompt as string) || "",
          tools: (anp.tools as string[]) || [],
          knowledge_sources: (anp.knowledge_sources as string[]) || [],
          privacy_level: (anp.privacy_level as string) || "medium",
          stake: (anp.stake as number) || 0,
        };
      })
    );

    return NextResponse.json({ agents, page, pageSize, total: agents.length });
  } catch (error) {
    console.error("Subgraph fetch failed, falling back to agents.json:", error);

    // Fallback to static agents.json
    try {
      const agentsPath = path.join(process.cwd(), "src/app/agents.json");
      const data = await fs.readFile(agentsPath, "utf-8");
      return NextResponse.json(JSON.parse(data), { status: 200 });
    } catch {
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }
  }
}
