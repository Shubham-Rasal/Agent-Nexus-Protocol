/**
 * LinkedIn Jobs x402 Agent.
 *
 * Paid agent that scrapes LinkedIn's public guest job-search endpoint for
 * postings created in the last 24 hours, given a `keywords` and (optional)
 * `location` query.
 *
 * Flow mirrors /api/demo-x402-agent:
 *   1. POST without payment → 402 + Payment-Required challenge.
 *   2. POST with valid x402 EIP-712 signature → 200 with parsed job list.
 *
 * Cost: 0.01 USDC on Base Sepolia.
 *
 * NOTE: Uses LinkedIn's public guest endpoint (no auth required). LinkedIn may
 * rate-limit or block requests; in those cases the agent returns the upstream
 * status code with a `note` so the caller can see what happened.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData, getAddress, type Hex } from "viem";

const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const PAY_TO = "0x0A7c56744ed6fd786931E11E40F462CF213654b0";
const AMOUNT = "10000"; // 0.01 USDC (6 decimals)
const NETWORK = "eip155:84532";

const authorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

function buildChallenge(req: NextRequest) {
  const url = new URL(req.url);
  return {
    x402Version: 2 as const,
    error: "Payment required",
    resource: {
      url: `${url.origin}${url.pathname}`,
      description: "LinkedIn jobs agent — scrapes postings from the last 24h",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        asset: BASE_SEPOLIA_USDC,
        amount: AMOUNT,
        payTo: PAY_TO,
        maxTimeoutSeconds: 300,
        extra: { name: "USD Coin", version: "2" },
      },
    ],
  };
}

function paymentRequired(req: NextRequest, error?: string) {
  const challenge = buildChallenge(req);
  if (error) challenge.error = error;
  const encoded = Buffer.from(JSON.stringify(challenge)).toString("base64");
  return NextResponse.json(challenge, {
    status: 402,
    headers: { "Payment-Required": encoded },
  });
}

interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
  postedAgo: string;
}

/**
 * Hits LinkedIn's public guest search endpoint and parses the returned HTML
 * cards. `f_TPR=r86400` = past 24 hours.
 */
async function scrapeLinkedInJobs(
  keywords: string,
  location: string,
  limit: number,
): Promise<{ jobs: Job[]; status: number; note?: string }> {
  const params = new URLSearchParams({
    keywords,
    location,
    f_TPR: "r86400",
    start: "0",
  });
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    return {
      jobs: [],
      status: res.status,
      note: `LinkedIn responded ${res.status}. They may be rate-limiting; try again in a minute or change keywords/location.`,
    };
  }

  const html = await res.text();

  // Each job is wrapped in <li>…<div class="base-card">…</div></li>
  const cardBlocks = html.split(/<li[^>]*>/i).slice(1);
  const jobs: Job[] = [];

  for (const block of cardBlocks) {
    if (jobs.length >= limit) break;

    const titleMatch = block.match(
      /class="base-search-card__title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h3>/i,
    );
    const companyMatch = block.match(
      /class="base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/i,
    );
    const locationMatch = block.match(
      /class="job-search-card__location[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/span>/i,
    );
    const urlMatch = block.match(
      /href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"?#]+)/i,
    );
    const timeMatch = block.match(
      /<time[^>]*>\s*([\s\S]*?)\s*<\/time>/i,
    );

    if (!titleMatch || !urlMatch) continue;

    const clean = (s: string) =>
      s
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();

    jobs.push({
      title: clean(titleMatch[1]),
      company: companyMatch ? clean(companyMatch[1]) : "Unknown",
      location: locationMatch ? clean(locationMatch[1]) : "Unknown",
      url: urlMatch[1],
      postedAgo: timeMatch ? clean(timeMatch[1]) : "recent",
    });
  }

  return { jobs, status: 200 };
}

export async function GET(req: NextRequest) {
  return paymentRequired(req);
}

export async function POST(req: NextRequest) {
  const paymentHeader =
    req.headers.get("payment-signature") ?? req.headers.get("x-payment");

  if (!paymentHeader) return paymentRequired(req);

  // Decode x402 payment payload
  let payload: {
    x402Version?: number;
    payload?: {
      authorization?: {
        from: string;
        to: string;
        value: string;
        validAfter: string;
        validBefore: string;
        nonce: string;
      };
      signature?: string;
    };
    accepted?: { asset?: string; payTo?: string; amount?: string; network?: string };
  };
  try {
    const json = Buffer.from(paymentHeader, "base64").toString("utf8");
    payload = JSON.parse(json);
  } catch {
    return paymentRequired(req, "Malformed payment header (invalid base64/JSON)");
  }

  const auth = payload?.payload?.authorization;
  const signature = payload?.payload?.signature as Hex | undefined;
  if (!auth || !signature) {
    return paymentRequired(req, "Missing authorization or signature in payload");
  }

  const accepted = payload.accepted;
  if (accepted) {
    if (accepted.asset && getAddress(accepted.asset) !== getAddress(BASE_SEPOLIA_USDC)) {
      return paymentRequired(req, `Wrong asset: expected ${BASE_SEPOLIA_USDC}`);
    }
    if (accepted.payTo && getAddress(accepted.payTo) !== getAddress(PAY_TO)) {
      return paymentRequired(req, `Wrong payTo: expected ${PAY_TO}`);
    }
    if (accepted.amount && accepted.amount !== AMOUNT) {
      return paymentRequired(req, `Wrong amount: expected ${AMOUNT}`);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  if (now < Number(auth.validAfter)) return paymentRequired(req, "Authorization not yet valid");
  if (now > Number(auth.validBefore)) return paymentRequired(req, "Authorization expired");

  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: 84532,
    verifyingContract: getAddress(BASE_SEPOLIA_USDC),
  } as const;
  const message = {
    from: getAddress(auth.from),
    to: getAddress(auth.to),
    value: BigInt(auth.value),
    validAfter: BigInt(auth.validAfter),
    validBefore: BigInt(auth.validBefore),
    nonce: auth.nonce as Hex,
  };

  let valid = false;
  try {
    valid = await verifyTypedData({
      address: getAddress(auth.from) as `0x${string}`,
      domain,
      types: authorizationTypes,
      primaryType: "TransferWithAuthorization",
      message,
      signature,
    });
  } catch (err) {
    return paymentRequired(
      req,
      `Signature verification threw: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  if (!valid) return paymentRequired(req, "EIP-712 signature did not recover to `from`");

  // Payment verified — now do the actual work
  let body: { keywords?: string; location?: string; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* body optional */
  }

  const keywords = (body.keywords ?? "software engineer").toString().slice(0, 200);
  const location = (body.location ?? "United States").toString().slice(0, 200);
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 25);

  let result: { jobs: Job[]; status: number; note?: string };
  try {
    result = await scrapeLinkedInJobs(keywords, location, limit);
  } catch (err) {
    result = {
      jobs: [],
      status: 500,
      note: `Scrape failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  const receipt = {
    success: true,
    query: { keywords, location, limit, postedWithin: "24h" },
    upstreamStatus: result.status,
    count: result.jobs.length,
    jobs: result.jobs,
    note: result.note,
    verified: {
      from: auth.from,
      to: auth.to,
      value: auth.value,
      nonce: auth.nonce,
    },
    settlement: "NOT_BROADCAST_DEMO_MODE",
  };

  const receiptHeader = Buffer.from(
    JSON.stringify({ x402Version: 2, success: true, settlement: "demo" }),
  ).toString("base64");

  return NextResponse.json(receipt, {
    status: 200,
    headers: {
      "PAYMENT-RESPONSE": receiptHeader,
      "X-Payment-Response": receiptHeader,
      "Access-Control-Expose-Headers": "PAYMENT-RESPONSE,X-Payment-Response",
    },
  });
}
