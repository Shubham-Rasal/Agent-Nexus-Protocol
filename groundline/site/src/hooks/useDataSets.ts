import { Synapse, RPC_URLS, WarmStorageService, EnhancedDataSetInfo } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/hooks/useNetwork";
import { useAccount } from "wagmi";

/**
 * Hook to fetch and manage data sets
 * @returns Query result containing data sets and their details
 */
export const useDataSets = () => {
  const signer = useEthersSigner();
  const { data: network } = useNetwork();
  const { address } = useAccount();

  return useQuery<EnhancedDataSetInfo[], Error>({
    enabled: !!address,
    queryKey: ["datasets", address],
    queryFn: async () => {
      if (!network) throw new Error("Network not found");
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      // Initialize Synapse SDK to get the warm storage address
      const synapse = await Synapse.create({
        signer,
        rpcURL: RPC_URLS[network].websocket,
      });

      // Get warm storage address
      const warmStorageAddress = synapse.getWarmStorageAddress();

      // Create WarmStorageService instance
      const warmStorageService = await WarmStorageService.create(
        signer.provider,
        warmStorageAddress
      );

      // Get client data sets with details
      const dataSets = await warmStorageService.getClientDataSetsWithDetails(address);

      console.log(dataSets);
      return dataSets;
    },
    retry: false,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

