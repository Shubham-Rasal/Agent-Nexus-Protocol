"use client";

import { useState } from "react";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Wallet, ExternalLink } from "lucide-react";
import { toHex, pad, parseUnits } from "viem";

interface PaymentRequest {
  serviceName: string;
  endpoint: string;
  description: string;
  cost: string;
  currency: string;
  network: string;
  payTo: string;
  asset: string;
  inputParams: Record<string, unknown>;
}

type State = "idle" | "switching" | "signing" | "calling" | "done" | "denied" | "error";

// EIP-712 domain + types for EIP-3009 transferWithAuthorization (USDC v2)
const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export function PaymentApprovalCard({ request }: { request: PaymentRequest }) {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();

  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApprove = async () => {
    if (!address) {
      setErrorMsg("Connect your wallet first.");
      setState("error");
      return;
    }

    try {
      // 1. Switch to Base Sepolia if needed
      if (chain?.id !== baseSepolia.id) {
        setState("switching");
        await switchChainAsync({ chainId: baseSepolia.id });
      }

      setState("signing");

      // 2. Build EIP-3009 authorization params
      const amount = parseUnits(request.cost, 6); // USDC = 6 decimals
      const validAfter = BigInt(0);
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min window
      // Random 32-byte nonce
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = toHex(nonceBytes) as `0x${string}`;

      const domain = {
        name: "USD Coin",
        version: "2",
        chainId: baseSepolia.id,
        verifyingContract: request.asset as `0x${string}`,
      };

      const message = {
        from: address,
        to: request.payTo as `0x${string}`,
        value: amount,
        validAfter,
        validBefore,
        nonce,
      };

      // 3. Sign — opens wallet popup (signature only, no gas)
      const signature = await signTypedDataAsync({
        domain,
        types: EIP3009_TYPES,
        primaryType: "TransferWithAuthorization",
        message,
      });

      // 4. Build x402 v2 payment payload and call service
      setState("calling");

      const paymentPayload = {
        x402Version: 2,
        scheme: "exact",
        network: request.network || "eip155:84532",
        payload: {
          signature,
          authorization: {
            from: address,
            to: request.payTo,
            value: amount.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce,
          },
        },
      };

      const res = await fetch("/api/agent-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: request.endpoint,
          inputParams: request.inputParams,
          payment: paymentPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Service error ${res.status}`);
      setResult(json);
      setState("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("user rejected")
      ) {
        setState("denied");
      } else {
        setErrorMsg(msg);
        setState("error");
      }
    }
  };

  return (
    <div className="my-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border">
        <Wallet className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{request.serviceName}</p>
          <p className="text-xs text-muted-foreground truncate">{request.description}</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment</span>
          <span className="text-sm font-semibold text-foreground">
            {request.cost} {request.currency}
          </span>
        </div>

        {/* Params */}
        {Object.keys(request.inputParams).length > 0 && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1">
            {Object.entries(request.inputParams).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{k}:</span>
                <span className="text-foreground truncate font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Network: Base Sepolia · USDC</p>
        <p className="text-xs text-muted-foreground">Signing only — no gas required</p>

        {state === "idle" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleApprove} className="flex-1">
              Approve & Sign
            </Button>
            <Button size="sm" variant="outline" onClick={() => setState("denied")} className="flex-1">
              Deny
            </Button>
          </div>
        )}

        {state === "switching" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Switching to Base Sepolia…" />
        )}
        {state === "signing" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Sign the payment in your wallet (no gas)…" />
        )}
        {state === "calling" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Calling service…" />
        )}
        {state === "denied" && (
          <Status icon={<XCircle className="h-4 w-4 text-destructive" />} text="Payment denied." />
        )}
        {state === "error" && (
          <Status icon={<XCircle className="h-4 w-4 text-destructive" />} text={errorMsg} error />
        )}
        {state === "done" && result && (
          <div className="space-y-2">
            <Status icon={<CheckCircle className="h-4 w-4 text-green-600" />} text="Done! Here are the results:" />
            <ServiceResultDisplay data={(result as any).data} />
          </div>
        )}
      </div>
    </div>
  );
}

function Status({ icon, text, error }: { icon: React.ReactNode; text: string; error?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ServiceResultDisplay({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") {
    return <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-48">{String(data)}</pre>;
  }

  const d = data as Record<string, unknown>;
  const brand = (d.data as Record<string, unknown>) ?? d;

  return (
    <div className="space-y-3 text-sm">
      {!!brand.brand_name && (
        <p className="font-semibold">{String(brand.brand_name)}</p>
      )}

      {Array.isArray(brand.logos) && (brand.logos as unknown[]).length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Logos</p>
          <div className="flex flex-wrap gap-2">
            {(brand.logos as string[]).slice(0, 4).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="logo" className="h-10 w-10 object-contain rounded border border-border bg-white p-1" />
              </a>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(brand.colors) && (brand.colors as unknown[]).length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Brand Colors</p>
          <div className="flex flex-wrap gap-2">
            {(brand.colors as string[]).slice(0, 8).map((color, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-5 w-5 rounded border border-border" style={{ background: color }} />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!d.cid && (
        <a
          href={`https://w3s.link/ipfs/${String(d.cid)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View on Filecoin <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {!brand.brand_name && !brand.logos && !brand.colors && (
        <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
