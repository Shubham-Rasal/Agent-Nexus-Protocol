"use client";

import { Card } from "@/components/ui/card";
import { WalletButton } from "@/components/wallet-button";
import { useAccount } from "wagmi";
import { useSynapse } from "@/hooks/useSynapse";
import { usePayerRails } from "@/hooks/usePayerRails";
import { usePayeeRails } from "@/hooks/usePayeeRails";
import { useAvailableBalance } from "@/hooks/useAvailableBalance";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, DollarSign, Lock, Unlock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";
import { RailInfo, SettlementResult } from "@filoz/synapse-sdk";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PaymentSection() {
  const { address, isConnected } = useAccount();
  const { data: synapse, isLoading: synapseLoading } = useSynapse();
  const { data: payerRails, isLoading: payerLoading, error: payerError } = usePayerRails();
  const { data: payeeRails, isLoading: payeeLoading, error: payeeError } = usePayeeRails();
  const { data: availableBalance, isLoading: balanceLoading } = useAvailableBalance();
  const [selectedRail, setSelectedRail] = useState<string | null>(null);
  const [preview, setPreview] = useState<SettlementResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const previewMutation = useMutation({
    mutationFn: async (railId: bigint) => {
      if (!synapse) throw new Error("Synapse not initialized");
      return await synapse.payments.getSettlementAmounts(railId);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success("Settlement preview loaded");
    },
    onError: (error) => {
      toast.error(`Failed to preview settlement: ${error.message}`);
    },
  });

  const settleMutation = useMutation({
    mutationFn: async (railId: bigint) => {
      if (!synapse) throw new Error("Synapse not initialized");
      const tx = await synapse.payments.settleAuto(railId);
      await tx.wait();
      return tx;
    },
    onSuccess: () => {
      toast.success("Rail settled successfully");
      // Refetch data
    },
    onError: (error) => {
      toast.error(`Settlement failed: ${error.message}`);
    },
  });

  // Loading and connection states similar to stored-data

  if (!isConnected) {
    return (
      <section id="payment" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Payment</h2>
          <p className="text-muted-foreground">Manage your payment rails and settlements</p>
        </div>
        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-2xl font-light mb-4">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to view and manage your payment rails.
            </p>
            <WalletButton />
          </div>
        </Card>
      </section>
    );
  }

  if (synapseLoading || balanceLoading || payerLoading || payeeLoading) {
    return (
      <section id="payment" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Payment</h2>
          <p className="text-muted-foreground">Manage your payment rails and settlements</p>
        </div>
        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </Card>
      </section>
    );
  }

  if (payerError || payeeError) {
    return (
      <section id="payment" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Payment</h2>
          <p className="text-muted-foreground">Manage your payment rails and settlements</p>
        </div>
        <Card className="border border-red-500/20 bg-card p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-light mb-4">Error Loading Payments</h3>
          <p className="text-red-600 mb-4">{(payerError || payeeError)?.message}</p>
          <p className="text-muted-foreground text-sm">
            Please try refreshing or check your network connection.
          </p>
        </Card>
      </section>
    );
  }

  // Calculate stats
  const paymentStats = [
    { label: "Available Balance", value: availableBalance ? `${parseFloat(formatUnits(availableBalance, 18)).toFixed(4)} USDFC` : "0 USDFC", icon: Unlock },
    // @ts-ignore
    { label: "Active Outgoing Rails", value: payerRails?.filter(r => r.endEpoch === 0).length.toString() ?? "0", icon: ArrowRight },
    // @ts-ignore
    { label: "Active Incoming Rails", value: payeeRails?.filter(r => r.endEpoch === 0).length.toString() ?? "0", icon: DollarSign },
    { label: "Terminated Rails", value: (payerRails?.filter(r => Number(r.endEpoch) > 0).length ?? 0) + (payeeRails?.filter(r => Number(r.endEpoch) > 0).length ?? 0).toString() || "0", icon: AlertTriangle },
  ];

  return (
    <section id="payment" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Payment</h2>
        <p className="text-muted-foreground">Manage your payment rails and settlements</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {paymentStats.map((stat, index) => (
          <Card key={index} className="border border-foreground/10 bg-card p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <stat.icon className="w-4 h-4" />
              {stat.label}
            </div>
            <div className="text-3xl font-light overflow-hidden text-ellipsis whitespace-nowrap">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Outgoing Rails */}
      <Card className="border border-foreground/10 bg-card p-6 mb-8">
        <h3 className="text-xl font-light mb-4">Outgoing Rails (Payer)</h3>
        {payerRails?.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No outgoing rails found</div>
        ) : (
          <div className="space-y-4">
            {payerRails?.map((rail) => (
              <div key={rail.railId.toString()} className="border-b border-foreground/5 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-sm">Rail #{rail.railId.toString()}</div>
                    <div className="text-xs text-muted-foreground">Rail ID: {rail.railId.toString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatUnits(rail.rate ?? BigInt(0), 18)} USDFC/epoch</div>
                    <div className={`text-xs ${Number(rail.endEpoch) > 0 ? "text-red-600" : "text-green-600"}`}>
                      {Number(rail.endEpoch) > 0 ? `Terminated at ${rail.endEpoch.toString()}` : "Active"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedRail(rail.railId.toString());
                      previewMutation.mutate(BigInt(rail.railId), { onSuccess: () => setIsPreviewOpen(true) });
                    }}
                  >
                    Preview Settlement
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => settleMutation.mutate(BigInt(rail.railId))}
                    disabled={settleMutation.isPending}
                  >
                    {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Settle"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Incoming Rails */}
      <Card className="border border-foreground/10 bg-card p-6">
        <h3 className="text-xl font-light mb-4">Incoming Rails (Payee)</h3>
        {payeeRails?.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No incoming rails found</div>
        ) : (
          <div className="space-y-4">
            {payeeRails?.map((rail) => (
              <div key={rail.railId.toString()} className="border-b border-foreground/5 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-sm">Rail #{rail.railId.toString()}</div>
                    <div className="text-xs text-muted-foreground">From: {rail.from?.slice(0, 6) ?? 'Unknown'}...{rail.from?.slice(-4) ?? ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatUnits(rail.rate ?? BigInt(0), 18)} USDFC/epoch</div>
                    <div className={`text-xs ${Number(rail.endEpoch) > 0 ? "text-red-600" : "text-green-600"}`}>
                      {Number(rail.endEpoch) > 0 ? `Terminated at ${rail.endEpoch.toString()}` : "Active"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedRail(rail.railId.toString());
                      previewMutation.mutate(BigInt(rail.railId), { onSuccess: () => setIsPreviewOpen(true) });
                    }}
                  >
                    Preview Settlement
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => settleMutation.mutate(BigInt(rail.railId))}
                    disabled={settleMutation.isPending}
                  >
                    {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Settle"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* @ts-ignore */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement Preview for Rail #{selectedRail}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>Total: {preview ? formatUnits(preview.totalSettledAmount, 18) : '0'} USDFC</div>
            <div>Payee: {preview ? formatUnits(preview.totalNetPayeeAmount, 18) : '0'} USDFC</div>
            <div>Commission: {preview ? formatUnits(preview.totalOperatorCommission, 18) : '0'} USDFC</div>
            <div>Up to epoch: {preview?.finalSettledEpoch.toString() ?? "N/A"}</div>
            <div>Note: {preview?.note ?? "N/A"}</div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
