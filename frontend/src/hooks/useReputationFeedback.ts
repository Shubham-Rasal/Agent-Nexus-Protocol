"use client";

import { useState } from "react";
import { useSendTransaction, useAccount } from "wagmi";
import { toast } from "sonner";

type FeedbackStatus = "idle" | "pending" | "submitted" | "error";

export function useReputationFeedback() {
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [status, setStatus] = useState<FeedbackStatus>("idle");

  async function submitFeedback(agentId: string, rating: 1 | 5) {
    if (!agentId) return;

    if (!isConnected) {
      toast.error("Connect your wallet to submit on-chain feedback");
      return;
    }

    setStatus("pending");
    try {
      const res = await fetch("/api/reputation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, rating }),
      });
      const { to, data, error } = await res.json();
      if (error) throw new Error(error);

      const hash = await sendTransactionAsync({ to, data });
      toast.success("Feedback submitted on-chain", {
        description: hash.slice(0, 10) + "…",
      });
      setStatus("submitted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Feedback failed", { description: msg });
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return { submitFeedback, status };
}
