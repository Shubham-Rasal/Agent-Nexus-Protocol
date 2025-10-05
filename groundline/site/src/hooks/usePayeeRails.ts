import { useQuery } from "@tanstack/react-query";
import { useSynapse } from "./useSynapse";
import { useAccount } from "wagmi";

export const usePayeeRails = () => {
  const { data: synapse } = useSynapse();
  const { address } = useAccount();

  return useQuery({
    queryKey: ["payeeRails", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      return await synapse.payments.getRailsAsPayee();
    },
    enabled: !!synapse && !!address,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};
