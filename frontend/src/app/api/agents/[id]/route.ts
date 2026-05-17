import { NextRequest, NextResponse } from "next/server";
import { fetchAgentCard } from "@/lib/subgraph";
import { getCachedReputationScore } from "@/lib/reputationCache";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // agentURI comes from the client as a query param (already known from the list)
  const url = new URL(_request.url);
  const agentURI = url.searchParams.get("agentURI") ?? "";

  const [card, reputationScore] = await Promise.all([
    fetchAgentCard(agentURI).catch(() => null),
    getCachedReputationScore(id).catch(() => 50),
  ]);

  const anp = (card?.anp as Record<string, unknown>) ?? {};
  const rawServices = (card?.services as any[]) ?? [];

  // Extract agentWallet address (used as default payTo for x402 services)
  const walletService = rawServices.find((s: any) => s.name === "agentWallet");
  const agentWalletAddress = walletService?.endpoint
    ? walletService.endpoint.split(":").pop() // "eip155:84532:0xABC" → "0xABC"
    : "";

  // Enrich each service with payTo derived from agentWallet when missing
  const services = rawServices
    .filter((s: any) => s.name !== "agentWallet")
    .map((s: any) => ({
      ...s,
      payTo: s.payTo ?? s.payment?.payTo ?? agentWalletAddress,
      asset: s.asset ?? s.payment?.asset ?? "",
      network: s.network ?? s.payment?.network ?? "",
      cost: s.cost ?? s.payment?.amount ?? "",
      currency: s.currency ?? s.payment?.currency ?? "",
    }));

  return NextResponse.json({
    reputationScore,
    name: (card?.name as string) || `Agent #${id}`,
    description: (card?.description as string) || "",
    active: (card?.active as boolean) ?? true,
    x402Support: (card?.x402Support as boolean) ?? false,
    services,
    systemPrompt: (anp.systemPrompt as string) || "",
    tools: (anp.tools as string[]) || [],
    knowledge_sources: (anp.knowledge_sources as string[]) || [],
    privacy_level: (anp.privacy_level as string) || "medium",
    stake: (anp.stake as number) || 0,
  });
}
