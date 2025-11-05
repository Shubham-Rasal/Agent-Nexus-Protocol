import { useQuery } from "@tanstack/react-query";
import { useSynapse } from "./useSynapse";
import { useAccount } from "wagmi";
import { TOKENS } from "@filoz/synapse-sdk";

export const useAvailableBalance = () => {
  const { data: synapse } = useSynapse();
  const { address } = useAccount();

  return useQuery({
    queryKey: ["availableBalance", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      return await synapse.payments.walletBalance();
    },
    enabled: !!synapse && !!address,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};


export const useAvailableBalanceInUSDFC = () => {
  const { data: synapse } = useSynapse();
  const { address } = useAccount();

  return useQuery({
    queryKey: ["availableBalanceInUSDFC", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      return await synapse.payments.walletBalance(TOKENS.USDFC);
    },
    enabled: !!synapse && !!address,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};