"use client";

import { useState, useCallback } from "react";
import { initLitClient, getLitClient, encryptFile, type EncryptedFileData } from "@/lib/lit-protocol";
// import { createLitClient } from "@lit-protocol/lit-client";
import { useAccount } from "wagmi";

/**
 * React hook for Lit Protocol encryption functionality
 */
export function useLitProtocol() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [litClient, setLitClient] = useState<any | null>(null);
  
  // Get wallet connection status from wagmi
  const { address: connectedWallet, isConnected } = useAccount();

  /**
   * Initialize Lit Protocol client
   */
  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      const client = await initLitClient();
      setLitClient(client);
      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to initialize Lit Protocol:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize Lit Protocol");
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing]);

  /**
   * Encrypt a file with specified access control
   */
  const encryptFileData = useCallback(
    async (
      fileContent: string,
      fileName: string,
      fileSize: number,
      accessType: "public" | "private" = "public"
    ): Promise<EncryptedFileData> => {
      if (!isInitialized) {
        throw new Error("Lit Protocol not initialized");
      }

      // For private encryption, use connected wallet or throw error
      const authorizedWallet = accessType === "private" 
        ? connectedWallet 
        : undefined;

      if (accessType === "private" && !authorizedWallet) {
        throw new Error("Wallet must be connected for private encryption");
      }

      return await encryptFile(fileContent, fileName, fileSize, {
        accessType,
        authorizedWallet,
      });
    },
    [isInitialized, connectedWallet]
  );

  return {
    isInitialized,
    isInitializing,
    error,
    litClient,
    connectedWallet,
    isWalletConnected: isConnected,
    encryptFileData,
    initialize,
  };
}

