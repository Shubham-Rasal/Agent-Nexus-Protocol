/**
 * Local x402 demo agent.
 *
 * Purpose: verify the *signature flow* end-to-end without depending on any
 * external agent / facilitator. This route:
 *   1. Returns 402 + a valid Payment-Required challenge when called without payment.
 *   2. When called with `PAYMENT-SIGNATURE` (v2) or `X-PAYMENT` (v1), decodes,
 *      validates the EIP-712 TransferWithAuthorization signature against the
 *      expected USDC domain on Base Sepolia, and returns 200 with a payload.
 *
 * It does NOT submit the transferWithAuthorization on-chain (no facilitator,
 * no broadcaster). This is solely to prove the signing/verification half of
 * the x402 protocol works in this repo. For real settlement you need a
 * facilitator with a funded relayer + (optionally) CDP API keys.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyTypedData, getAddress, type Hex } from "viem";

const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const DEMO_PAY_TO = "0x0A7c56744ed6fd786931E11E40F462CF213654b0";
const DEMO_AMOUNT = "1000"; // 0.001 USDC (6 decimals)
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
      description: "Local x402 demo agent — verifies signed payment payload",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        asset: BASE_SEPOLIA_USDC,
        amount: DEMO_AMOUNT,
        payTo: DEMO_PAY_TO,
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

export async function GET(req: NextRequest) {
  // GET surfaces the challenge so the demo flow can be inspected from a browser
  return paymentRequired(req);
}

export async function POST(req: NextRequest) {
  const paymentHeader =
    req.headers.get("payment-signature") ?? req.headers.get("x-payment");

  if (!paymentHeader) return paymentRequired(req);

  // Decode the base64 payment payload
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

  // Cross-check declared accepted matches what we asked for
  const accepted = payload.accepted;
  if (accepted) {
    if (accepted.asset && getAddress(accepted.asset) !== getAddress(BASE_SEPOLIA_USDC)) {
      return paymentRequired(req, `Wrong asset: expected ${BASE_SEPOLIA_USDC}`);
    }
    if (accepted.payTo && getAddress(accepted.payTo) !== getAddress(DEMO_PAY_TO)) {
      return paymentRequired(req, `Wrong payTo: expected ${DEMO_PAY_TO}`);
    }
    if (accepted.amount && accepted.amount !== DEMO_AMOUNT) {
      return paymentRequired(req, `Wrong amount: expected ${DEMO_AMOUNT}`);
    }
  }

  // Validate window
  const now = Math.floor(Date.now() / 1000);
  const validAfter = Number(auth.validAfter);
  const validBefore = Number(auth.validBefore);
  if (now < validAfter) return paymentRequired(req, "Authorization not yet valid");
  if (now > validBefore) return paymentRequired(req, "Authorization expired");

  // Verify EIP-712 signature against USDC domain on Base Sepolia
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

  // Success! In a real flow the facilitator would broadcast transferWithAuthorization
  // here. We just acknowledge.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* body optional */
  }

  const receipt = {
    success: true,
    verified: {
      from: auth.from,
      to: auth.to,
      value: auth.value,
      nonce: auth.nonce,
    },
    settlement: "NOT_BROADCAST_DEMO_MODE",
    note:
      "Signature is valid. In production, a facilitator would submit transferWithAuthorization(...) on-chain.",
    input: body,
  };

  // Echo a base64 receipt header so wrapFetchWithPayment can parse it
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
