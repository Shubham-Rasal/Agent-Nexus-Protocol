"use client";

import { Card } from "@/components/ui/card";
import { WalletButton } from "@/components/wallet-button";
import { useAccount } from "wagmi";
import { useSynapse } from "@/hooks/useSynapse";
import { useAvailableBalance, useAvailableBalanceInUSDFC } from "@/hooks/useAvailableBalance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Wallet,
  Shield,
  CheckCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUnits, parseUnits } from "viem";
import { useState } from "react";
import { toast } from "sonner";
import { ethers } from "ethers";

export function PaymentSection() {
  const { address, isConnected } = useAccount();
  const { data: synapse, isLoading: synapseLoading } = useSynapse();
  const { data: availableBalance, isLoading: balanceLoading } =
    useAvailableBalance();
  const { data: availableBalanceInUSDFC, isLoading: balanceLoadingInUSDFC } =
    useAvailableBalanceInUSDFC();
  const queryClient = useQueryClient();
  
  const [depositAmount, setDepositAmount] = useState("");
  const [rateAllowance, setRateAllowance] = useState("10");
  const [lockupAllowance, setLockupAllowance] = useState("1000");
  const [maxLockupDays, setMaxLockupDays] = useState("30");

  // Query to get token allowance for payments contract
  const { data: tokenAllowance } = useQuery({
    queryKey: ["tokenAllowance", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      const paymentsAddress = await synapse.getPaymentsAddress();
      return await synapse.payments.allowance(paymentsAddress);
    },
    enabled: !!synapse && !!address,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Query to get service approval status
  const { data: serviceApprovalStatus, refetch: refetchServiceStatus } = useQuery({
    queryKey: ["serviceApproval", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      const warmStorageAddress = await synapse.getWarmStorageAddress();
      return await synapse.payments.serviceApproval(warmStorageAddress);
    },
    enabled: !!synapse && !!address,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!synapse) throw new Error("Synapse not initialized");
      const parsedAmount = ethers.parseUnits(amount, 18);
      const tx = await synapse.payments.deposit(parsedAmount);
      await tx.wait();
      return tx;
    },
    onSuccess: () => {
      toast.success("USDFC deposited successfully!");
      setDepositAmount("");
      queryClient.invalidateQueries({ queryKey: ["availableBalance"] });
    },
    onError: (error: any) => {
      toast.error(`Deposit failed: ${error.message}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      const warmStorageAddress = await synapse.getWarmStorageAddress();
      const parsedRateAllowance = ethers.parseUnits(rateAllowance, 18);
      const parsedLockupAllowance = ethers.parseUnits(lockupAllowance, 18);
      const maxLockupEpochs = BigInt(parseInt(maxLockupDays) * 86400);
      
      const tx = await synapse.payments.approveService(
        warmStorageAddress,
        parsedRateAllowance,
        parsedLockupAllowance,
        maxLockupEpochs
      );
      await tx.wait();
      return tx;
    },
    onSuccess: () => {
      toast.success("Warm Storage service approved successfully!");
      refetchServiceStatus();
    },
    onError: (error: any) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  // Loading and connection states similar to stored-data

  if (!isConnected) {
    return (
      <section id="payment" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Payment</h2>
          <p className="text-muted-foreground">
            Deposit USDFC and manage storage payments
          </p>
        </div>
        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-2xl font-light mb-4">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to deposit USDFC and enable storage payments.
            </p>
            <WalletButton />
          </div>
        </Card>
      </section>
    );
  }

  if (synapseLoading || balanceLoading || balanceLoadingInUSDFC) {
    return (
      <section id="payment" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Payment</h2>
          <p className="text-muted-foreground">
            Deposit USDFC and manage storage payments
          </p>
        </div>
        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading payment information...
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section id="payment" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Payment</h2>
        <p className="text-muted-foreground">
          Deposit USDFC and manage storage payments
        </p>
      </div>

      {/* Available Balance */}
      <Card className="border border-foreground/10 bg-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-xl font-light">Available Balance</h3>
        </div>
        <div className="flex items-center gap-3">
        <div className="text-4xl font-light">
          {availableBalance
            ? `${parseFloat(formatUnits(availableBalance, 18)).toFixed(4)} tFIL`
            : "0 tFIL"}
        </div>
        <div className="text-4xl font-light">
          {availableBalanceInUSDFC
            ? `${parseFloat(formatUnits(availableBalanceInUSDFC, 18)).toFixed(4)} USDFC`
            : "0 USDFC"}
        </div>
            </div>
      </Card>

      {/* Service Approval Status */}
      {serviceApprovalStatus && (
        <Card className={`border ${serviceApprovalStatus.isApproved ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'} p-6 mb-8`}>
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-light">Service Approval Status</h3>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
              serviceApprovalStatus.isApproved 
                ? 'bg-green-500 text-white' 
                : 'bg-orange-500 text-white'
            }`}>
              {serviceApprovalStatus.isApproved ? 'Approved' : 'Not Approved'}
            </div>
          </div>
          
          {serviceApprovalStatus.isApproved && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Rate Allowance</div>
                <div className="font-medium">
                  {parseFloat(formatUnits(serviceApprovalStatus.rateAllowance, 18)).toFixed(2)} USDFC
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Rate Used</div>
                <div className="font-medium">
                  {parseFloat(formatUnits(serviceApprovalStatus.rateUsed, 18)).toFixed(2)} USDFC
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Lockup Allowance</div>
                <div className="font-medium">
                  {parseFloat(formatUnits(serviceApprovalStatus.lockupAllowance, 18)).toFixed(2)} USDFC
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Max Lockup Period</div>
                <div className="font-medium">
                  {(Number(serviceApprovalStatus.maxLockupPeriod) / 86400).toFixed(0)} days
                </div>
              </div>
            </div>
          )}
          
          {!serviceApprovalStatus.isApproved && (
            <p className="text-sm text-muted-foreground">
              Approve the Warm Storage service below to enable automated storage payments.
            </p>
          )}
        </Card>
      )}

      

      <div className="grid md:grid-cols-2 gap-8">
        {/* Deposit USDFC */}
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-light">Deposit USDFC</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Amount (USDFC)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="100"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={depositMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deposit USDFC tokens to your Synapse balance
              </p>
            </div>
            <Button
              onClick={() => depositMutation.mutate(depositAmount)}
              disabled={!depositAmount || depositMutation.isPending}
              className="w-full"
            >
              {depositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Depositing...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </div>
        </Card>

        {/* Approve Warm Storage Service */}
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-light">Approve Storage Service</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rate-allowance">Rate Allowance (USDFC/epoch)</Label>
              <Input
                id="rate-allowance"
                type="number"
                placeholder="10"
                value={rateAllowance}
                onChange={(e) => setRateAllowance(e.target.value)}
                disabled={approveMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="lockup-allowance">Lockup Allowance (USDFC)</Label>
              <Input
                id="lockup-allowance"
                type="number"
                placeholder="1000"
                value={lockupAllowance}
                onChange={(e) => setLockupAllowance(e.target.value)}
                disabled={approveMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="max-lockup-days">Max Lockup Period (days)</Label>
              <Input
                id="max-lockup-days"
                type="number"
                placeholder="30"
                value={maxLockupDays}
                onChange={(e) => setMaxLockupDays(e.target.value)}
                disabled={approveMutation.isPending}
              />
            </div>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="w-full"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Service
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Approve Warm Storage to automatically process payments for your storage uploads
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
