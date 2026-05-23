import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function validateHttpEndpoint(endpoint: string): string | null {
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return `Endpoint must use http or https, got: ${parsed.protocol}`;
    }
    return null;
  } catch {
    return `Invalid URL: "${endpoint}"`;
  }
}

// GET — for polling async agent status/report endpoints
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") ?? "";

  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const validationError = validateHttpEndpoint(endpoint);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      let data: unknown;
      try { data = await res.json(); } catch { data = await res.text(); }
      return NextResponse.json({ error: `Service error ${res.status}`, details: data }, { status: res.status });
    }

    let data: unknown;
    try { data = await res.json(); } catch { data = await res.text(); }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[agent-service GET] fetch error for:", endpoint, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", endpoint },
      { status: 500 }
    );
  }
}

// POST — transparent proxy to the agent's endpoint.
//
// Each agent runs its own x402 flow. ANP forwards the X-PAYMENT /
// PAYMENT-SIGNATURE header through unchanged and returns the agent's
// response (including 402 challenges and PAYMENT-RESPONSE receipts)
// transparently so `wrapFetchWithPayment` on the client can complete
// the handshake against the agent directly.
//
// The only ANP-hosted x402 agent today is /api/demo-x402-agent, which
// runs its own verification. External agents either work because they
// implement x402 correctly, or fail with their own 402 — ANP does NOT
// act as a facilitator for them.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const { endpoint, inputParams } = body as {
    endpoint?: string;
    inputParams?: Record<string, unknown>;
  };

  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  const validationError = validateHttpEndpoint(endpoint);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // Forward the payment header(s) if present.
  const paymentHeader =
    req.headers.get("payment-signature") ?? req.headers.get("x-payment");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (paymentHeader) {
    headers["PAYMENT-SIGNATURE"] = paymentHeader;
    headers["X-PAYMENT"] = paymentHeader;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(inputParams ?? {}),
      signal: AbortSignal.timeout(30000),
    });

    // Read body once
    let data: unknown;
    let raw = "";
    try {
      raw = await res.text();
      data = raw ? JSON.parse(raw) : raw;
    } catch {
      data = raw;
    }

    // 402 → pass through unchanged so wrapFetchWithPayment can sign + retry.
    if (res.status === 402) {
      const passthrough = NextResponse.json(data ?? {}, { status: 402 });
      const challenge = res.headers.get("payment-required") ?? res.headers.get("PAYMENT-REQUIRED");
      if (challenge) passthrough.headers.set("PAYMENT-REQUIRED", challenge);
      return passthrough;
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Agent error ${res.status}`, details: data },
        { status: res.status },
      );
    }

    // Pass through PAYMENT-RESPONSE receipt headers so the client x402
    // library can parse the settlement result.
    const response = NextResponse.json({ success: true, data });
    const receipt =
      res.headers.get("payment-response") ??
      res.headers.get("x-payment-response");
    if (receipt) {
      response.headers.set("PAYMENT-RESPONSE", receipt);
      response.headers.set("X-Payment-Response", receipt);
    }
    return response;
  } catch (err) {
    console.error("[agent-service POST] fetch error for:", endpoint, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", endpoint },
      { status: 500 }
    );
  }
}
