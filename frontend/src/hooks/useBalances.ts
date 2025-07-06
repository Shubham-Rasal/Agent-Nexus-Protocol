import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useEthersSigner } from "./useEthers";
import { CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";
import { useNetwork } from "./useNetwork";
import { ethers } from "ethers";

const USDFC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const useBalances = () => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { data: network } = useNetwork();

  return useQuery({
    queryKey: ["balances", address],
    queryFn: async () => {
      if (!address || !signer || !network) return null;

      const usdfcContract = new ethers.Contract(
        CONTRACT_ADDRESSES.USDFC[network],
        USDFC_ABI,
        signer
      );

      const [balance, decimals] = await Promise.all([
        usdfcContract.balanceOf(address),
        usdfcContract.decimals(),
      ]);

      const usdfcBalance = balance;
      const usdfcBalanceFormatted = parseFloat(
        ethers.formatUnits(usdfcBalance, decimals)
      );

      return {
        usdfcBalance,
        usdfcBalanceFormatted,
      };
    },
    enabled: !!address && !!signer && !!network,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}; 