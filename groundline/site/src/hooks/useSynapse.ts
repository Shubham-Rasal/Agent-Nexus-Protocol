import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { useEthersSigner } from "./useEthers";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";

export const useSynapse = () => {
  const signer = useEthersSigner();
  const { data: network } = useNetwork();

  return useQuery({
    queryKey: ["synapse", network],
    queryFn: async () => {
      if (!network) throw new Error("Network not found");
      if (!signer) throw new Error("Signer not found");

      return await Synapse.create({
        signer,
        rpcURL: RPC_URLS[network].websocket,
      });
    },
    enabled: !!signer && !!network,
    staleTime: Infinity,
  });
};
