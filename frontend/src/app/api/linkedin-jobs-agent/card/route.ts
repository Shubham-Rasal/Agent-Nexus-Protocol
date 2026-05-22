import { NextResponse } from "next/server";

/**
 * Agent card for the LinkedIn Jobs x402 agent.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const endpoint = `${url.origin}/api/linkedin-jobs-agent`;
  const wallet = "0x0A7c56744ed6fd786931E11E40F462CF213654b0";

  return NextResponse.json({
    name: "LinkedIn Jobs Agent (24h)",
    description:
      "Paid agent that scrapes LinkedIn job postings created in the last 24 hours for a given keyword + location. Pay 0.01 USDC on Base Sepolia per query.",
    active: true,
    x402Support: true,
    services: [
      {
        name: "agentWallet",
        endpoint: `eip155:84532:${wallet}`,
      },
      {
        id: "fetch-recent-jobs",
        name: "Fetch Recent LinkedIn Jobs",
        description:
          "Returns LinkedIn job postings created in the last 24 hours matching `keywords` (e.g. 'software engineer') and optional `location` (e.g. 'San Francisco'). Costs 0.01 USDC on Base Sepolia.",
        endpoint,
        inputSchema: {
          type: "object",
          required: ["keywords"],
          properties: {
            keywords: {
              type: "string",
              description: "Job title or skill, e.g. 'rust backend engineer'",
            },
            location: {
              type: "string",
              description: "Location filter, e.g. 'Remote', 'New York', 'Germany'",
            },
            limit: {
              type: "number",
              description: "Max jobs to return (1–25, default 10)",
            },
          },
        },
        payment: {
          scheme: "exact",
          network: "eip155:84532",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: "10000",
          payTo: wallet,
          currency: "USDC",
          cost: "0.01",
          maxTimeoutSeconds: 300,
        },
      },
    ],
    anp: {
      systemPrompt: [
        "You are the LinkedIn Jobs Agent. You expose exactly one paid service: `fetch-recent-jobs`.",
        "It returns LinkedIn job postings created in the LAST 24 HOURS.",
        "",
        "When the user asks for recent jobs / job openings / new postings, IMMEDIATELY call the requestAgentService tool with EXACTLY these values:",
        `- serviceName: "Fetch Recent LinkedIn Jobs"`,
        `- endpoint: "${endpoint}"`,
        `- description: "Scrape LinkedIn jobs posted in the last 24 hours."`,
        `- cost: "0.01"`,
        `- currency: "USDC"`,
        `- network: "eip155:84532"`,
        `- payTo: "${wallet}"`,
        `- asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"`,
        "- inputParams: { keywords: <extracted from the user message, e.g. 'software engineer'>, location: <extracted, default 'United States'>, limit: <1-25, default 10> }",
        "",
        "Always extract `keywords` from the user's message. If they don't say a location, default to 'United States'. Never ask for confirmation — call the tool immediately. Never claim the cost is ETH.",
      ].join("\n"),
      tools: [],
      knowledge_sources: [],
      privacy_level: "low",
      stake: 0,
    },
  });
}
