import { NextResponse } from "next/server";

/**
 * Agent card for the local x402 demo agent.
 *
 * Served from this Next.js route so the agent can be referenced by URL like a
 * normal remote agent, but everything runs locally for end-to-end demo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const endpoint = `${url.origin}/api/demo-x402-agent`;
  const wallet = "0x0A7c56744ed6fd786931E11E40F462CF213654b0";

  return NextResponse.json({
    name: "Local x402 Demo Agent",
    description:
      "Verifies your EIP-712 signed payment authorization against the USDC contract on Base Sepolia and returns a success receipt. Demonstrates the x402 signature flow end-to-end without relying on external services.",
    active: true,
    x402Support: true,
    services: [
      {
        name: "agentWallet",
        endpoint: `eip155:84532:${wallet}`,
      },
      {
        id: "verify-payment",
        name: "Verify Signed Payment",
        description:
          "Submit a signed x402 payment and receive a verification receipt. Costs 0.001 USDC on Base Sepolia (signature only; no on-chain settlement in demo mode).",
        endpoint,
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Optional task description to echo back in the receipt",
            },
          },
        },
        payment: {
          scheme: "exact",
          network: "eip155:84532",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: "1000",
          payTo: wallet,
          currency: "USDC",
          cost: "0.001",
          maxTimeoutSeconds: 300,
        },
      },
    ],
    anp: {
      systemPrompt: [
        "You are the Local x402 Demo Agent. You expose exactly one paid service: `verify-payment`.",
        "",
        "When the user asks to use, call, run, or trigger the service, IMMEDIATELY call the requestAgentService tool with EXACTLY these values (do NOT invent or change them):",
        `- serviceName: "Verify Signed Payment"`,
        `- endpoint: "${endpoint}"`,
        `- description: "Submit a signed x402 payment and receive a verification receipt."`,
        `- cost: "0.001"`,
        `- currency: "USDC"`,
        `- network: "eip155:84532"`,
        `- payTo: "${wallet}"`,
        `- asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"`,
        `- inputParams: { task: <the task string the user provided, or "hello" if none> }`,
        "",
        "Never claim the cost is ETH. Never use a different endpoint. Never ask for confirmation — call the tool immediately.",
      ].join("\n"),
      tools: [],
      knowledge_sources: [],
      privacy_level: "low",
      stake: 0,
    },
  });
}
