import { NextRequest, NextResponse } from "next/server";
import {
  CONTRACT_ADDRESSES,
  REPUTATION_REGISTRY_ABI,
  publicClient,
} from "@/lib/contracts";
import { encodeFunctionData } from "viem";

// GET: return contract address + ABI so the client can submit feedback directly
export async function GET() {
  return NextResponse.json({
    contract: CONTRACT_ADDRESSES.ReputationRegistry,
    // Minimal ABI for giveFeedback
    abi: REPUTATION_REGISTRY_ABI.filter((x) => x.name === "giveFeedback"),
  });
}

// POST: returns unsigned calldata for client-side wallet signing.
// The client must sign and submit to avoid the self-feedback restriction
// (the contract blocks feedback from the agent owner).
export async function POST(req: NextRequest) {
  try {
    const { agentId, rating, taskContext = "" } = await req.json();

    if (!agentId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "agentId (string) and rating (1–5) required" },
        { status: 400 }
      );
    }

    // Map 1–5 stars → ERC-8004 value 0–100 (no decimals)
    const onChainValue = rating * 20; // 1→20, 3→60, 5→100

    const calldata = encodeFunctionData({
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "giveFeedback",
      args: [
        BigInt(agentId),
        BigInt(onChainValue),
        0,            // valueDecimals
        "taskSuccess",
        taskContext,  // tag2
        "",           // endpoint
        "",           // feedbackURI
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      ],
    });

    return NextResponse.json({
      to: CONTRACT_ADDRESSES.ReputationRegistry,
      data: calldata,
      agentId,
      rating,
      onChainValue,
      // Client should send: { to, data } via their connected wallet
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
