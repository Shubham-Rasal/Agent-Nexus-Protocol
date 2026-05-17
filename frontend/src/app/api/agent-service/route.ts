import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // allow up to 60s for external service calls

export async function POST(req: NextRequest) {
  const { endpoint, inputParams, payment } = await req.json();

  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  // x402 v2: X-PAYMENT is base64url-encoded JSON of the full payment object
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (payment) {
    headers["X-PAYMENT"] = Buffer.from(JSON.stringify(payment)).toString("base64");
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(inputParams),
      signal: AbortSignal.timeout(30000),
    });

    const body = await res.text();
    let data: unknown;
    try { data = JSON.parse(body); } catch { data = body; }

    if (res.status === 402) {
      // Return the 402 details so the client can debug
      return NextResponse.json(
        { error: "Payment rejected by service", details: data },
        { status: 402 }
      );
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Service error ${res.status}`, details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
