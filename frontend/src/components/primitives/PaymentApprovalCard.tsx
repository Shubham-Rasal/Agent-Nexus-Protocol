"use client";

import { useState } from "react";
import { useAccount, useSwitchChain, useWalletClient, usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Wallet, ExternalLink } from "lucide-react";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { wrapFetchWithPayment } from "@x402/fetch";

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

type State = "idle" | "switching" | "calling" | "signing" | "done" | "denied" | "error";

export function PaymentApprovalCard({ request }: { request: PaymentRequest }) {
  const { address, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  // Pin to Base Sepolia so the client is correct even when connected chain differs
  const publicClient = usePublicClient({ chainId: baseSepolia.id }) as PublicClient;

  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApprove = async () => {
    if (!address) {
      setErrorMsg("Connect your wallet first.");
      setState("error");
      return;
    }
    if (!walletClient || !publicClient) {
      setErrorMsg("Wallet not ready � please reconnect.");
      setState("error");
      return;
    }

    setErrorMsg("");

    try {
      // 1. Switch to Base Sepolia if needed
      if (chain?.id !== baseSepolia.id) {
        setState("switching");
        try {
          await switchChainAsync({ chainId: baseSepolia.id });
        } catch {
          setErrorMsg("Please click \u2018Approve\u2019 in the MetaMask \u2018Switch to Base Sepolia\u2019 popup, then try again.");
          setState("error");
          return;
        }
      }

      setState("calling");

      // Safety net: replace common placeholder strings with the real wallet address
      const PLACEHOLDERS = ["USER_WALLET_ADDRESS", "YOUR_WALLET_ADDRESS", "WALLET_ADDRESS", "user_wallet_address"];
      const resolvedInputParams = Object.fromEntries(
        Object.entries(request.inputParams).map(([k, v]) => [
          k,
          PLACEHOLDERS.includes(String(v)) ? (address ?? "unknown") : v,
        ])
      );

      // Pre-flight USDC balance check
      if (request.asset && request.asset.startsWith("0x")) {
        try {
          const balance = await publicClient.readContract({
            address: request.asset as `0x${string}`,
            abi: [{ name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" }] as const,
            functionName: "balanceOf",
            args: [address!],
          }) as bigint;
          const costNum = parseFloat(request.cost ?? "0");
          const requiredRaw = BigInt(Math.ceil(costNum * 1_000_000));
          if (balance < requiredRaw) {
            const balanceFormatted = (Number(balance) / 1_000_000).toFixed(4);
            setErrorMsg(
              `Insufficient USDC � you have $${balanceFormatted} but need $${costNum} on Base Sepolia. Get test USDC at faucet.circle.com`
            );
            setState("error");
            return;
          }
        } catch {
          // Balance check failed � proceed anyway
        }
      }

      // 2. Build x402 signer
      const signer = toClientEvmSigner(
        {
          address,
          signTypedData: async (msg) => {
            setState("signing");
            try {
              const sig = await walletClient.signTypedData({
                ...msg,
                account: address,
              } as Parameters<typeof walletClient.signTypedData>[0]);
              setState("calling");
              return sig;
            } catch (sigErr) {
              // Tag user-rejection so outer catch can give a clear message
              throw new Error("__SIGN_REJECTED__: " + (sigErr instanceof Error ? sigErr.message : ""));
            }
          },
        },
        publicClient as Parameters<typeof toClientEvmSigner>[1],
      );

      const client = new x402Client();
      client.register("eip155:*", new ExactEvmScheme(signer));
      const fetchWithPayment = wrapFetchWithPayment(fetch, client);

      const res = await fetchWithPayment("/api/agent-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: request.endpoint,
          inputParams: resolvedInputParams,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          let balance = "unknown";
          try {
            const bal = await publicClient.readContract({
              address: request.asset as `0x${string}`,
              abi: [{ name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" }] as const,
              functionName: "balanceOf",
              args: [address!],
            }) as bigint;
            balance = `$${(Number(bal) / 1_000_000).toFixed(4)} USDC`;
          } catch { /* ignore */ }
          const reason: string =
            json?.invalidReason ??
            json?.invalidMessage ??
            (json?.error && json.error !== "Payment required" ? json.error : "") ??
            "Unknown reason";
          setErrorMsg(
            `Payment verification failed: ${reason}. (Balance: ${balance})`,
          );
          setState("error");
          return;
        }
        throw new Error(json.error ?? `Service error ${res.status}`);
      }

      setResult(json);
      setState("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.startsWith("__SIGN_REJECTED__")) {
        setErrorMsg("You clicked Reject in MetaMask. Click \u2018Try Again\u2019 and then click \u2018Sign\u2019 in the MetaMask popup.");
      } else {
        setErrorMsg(msg);
      }
      setState("error");
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

        <p className="text-xs text-muted-foreground">Network: Base Sepolia � USDC</p>
        <p className="text-xs text-muted-foreground">Signing only � no gas required</p>
        
        {/* Step hint shown before approval */}
        {state === "idle" && (
          <p className="text-xs text-muted-foreground/70">
            MetaMask will show 1�2 prompts: switch network (if needed) then sign a gasless message.
          </p>
        )}

        {state === "idle" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleApprove} className="flex-1">
              Approve &amp; Sign
            </Button>
            <Button size="sm" variant="outline" onClick={() => setState("denied")} className="flex-1">
              Cancel
            </Button>
          </div>
        )}

        {state === "switching" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="MetaMask: accept the \u2018Switch to Base Sepolia\u2019 prompt�" />
        )}
        {state === "calling" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Contacting service�" />
        )}
        {state === "signing" && (
          <Status icon={<Loader2 className="h-4 w-4 animate-spin" />} text="MetaMask: click \u2018Sign\u2019 to authorise the gasless payment�" />
        )}
        {state === "denied" && (
          <div className="space-y-2">
            <Status icon={<XCircle className="h-4 w-4 text-muted-foreground" />} text="Cancelled." />
          </div>
        )}
        {state === "error" && (
          <div className="space-y-2">
            <Status icon={<XCircle className="h-4 w-4 text-destructive" />} text={errorMsg} error />
            <Button size="sm" variant="outline" onClick={() => { setState("idle"); setErrorMsg(""); }} className="w-full">
              Try Again
            </Button>
          </div>
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
