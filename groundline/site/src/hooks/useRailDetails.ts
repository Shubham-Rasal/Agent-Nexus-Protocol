import { useQuery } from "@tanstack/react-query";
import { useSynapse } from "./useSynapse";

export const useRailDetails = (railId: string) => {
  const { data: synapse } = useSynapse();

  return useQuery({
    queryKey: ["railDetails", railId],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not initialized");
      return await synapse.payments.getRail(Number(railId));
    },
    enabled: !!synapse && !!railId,
  });
};
