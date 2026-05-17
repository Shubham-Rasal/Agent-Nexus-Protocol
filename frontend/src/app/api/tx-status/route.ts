import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash") as `0x${string}` | null;
  if (!hash) return NextResponse.json({ error: "Missing hash" }, { status: 400 });

  try {
    const receipt = await client.getTransactionReceipt({ hash });
    return NextResponse.json({ status: receipt.status }); // "success" | "reverted"
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
