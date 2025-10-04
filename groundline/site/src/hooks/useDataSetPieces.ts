import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/hooks/useNetwork";
import { useAccount } from "wagmi";

// Custom JSON serializer that handles BigInt values
const safeStringify = (obj: any, space?: number) => {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , space);
};

/**
 * Hook to fetch pieces from a specific dataset using storage context
 * @param dataSetId - The ID of the dataset to fetch pieces from
 * @returns Query result containing pieces from the dataset
 */
export const useDataSetPieces = (dataSetId: number | null) => {
  const signer = useEthersSigner();
  const { data: network } = useNetwork();
  const { address } = useAccount();

  return useQuery({
    enabled: !!address && !!dataSetId && !!signer,
    queryKey: ["datasetPieces", address, dataSetId],
    queryFn: async () => {
      if (!network) throw new Error("Network not found");
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");
      if (!dataSetId) throw new Error("Dataset ID not found");

      // Initialize Synapse SDK
      const synapse = await Synapse.create({
        signer,
        rpcURL: RPC_URLS[network].websocket,
      });

      // Create storage context for the specific dataset
      const context = await synapse.storage.createContext({
        dataSetId: dataSetId,
        withCDN: true,
        callbacks: {
          onDataSetResolved: (info) => {
            console.log(`✅ Dataset resolved: ID ${info.dataSetId}`);
            console.log(`   Dataset info:`, safeStringify(info, 2));
          }
        }
      });

      console.log('✅ Storage context created successfully');
      console.log(`   Context metadata:`, safeStringify(context.dataSetMetadata, 2));

      // Get dataset pieces
      console.log('🧩 Getting dataset pieces...');
      try {
        const pieces = await context.getDataSetPieces();
        console.log(`   Dataset pieces count: ${pieces.length}`);
        
        // Transform pieces to match the expected format for PiecesGrid
        const piecesWithContext = pieces.map((pieceCid: string, index: number) => ({
          piece: {
            pieceId: (index + 1).toString(), // Generate a simple piece ID
            pieceCid: pieceCid,
            timestamp: new Date().toISOString(), // Placeholder timestamp
          },
          dataSet: {
            pdpVerifierDataSetId: dataSetId,
            payee: context.serviceProvider,
            details: null,
            serviceURL: null,
            provider: null
          } as any // Cast to match the expected type
        }));

        return {
          pieces: piecesWithContext,
          context: context,
          totalCount: pieces.length
        };
      } catch (error) {
        console.error('❌ Failed to get dataset pieces:', error);
        throw error;
      }
    },
    retry: true,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

