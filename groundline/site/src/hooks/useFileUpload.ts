"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { preflightCheck } from "@/utils/preflightCheck";
import { useSynapse } from "@/hooks/useSynapse";
import { encryptFileWithLit, initLitClient } from "@/lib/litClient";

export type UploadedInfo = {
  fileName?: string;
  fileSize?: number;
  pieceCid?: string;
  txHash?: string;
  encrypted?: boolean;
  dataToEncryptHash?: string;
  fileType?: string;
  // Metadata from Lit encryption
  encryptedMetadata?: {
    dataToEncryptHash: string;
    originalFileName: string;
    originalFileSize: number;
    originalFileType: string;
    encryptedAt: number;
  };
};

/**
 * Hook to upload a file to the Filecoin network using Synapse.
 */
export const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);
  const { data: synapse } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationKey: ["file-upload", address],
    mutationFn: async ({ file, encrypt = false }: { file: File; encrypt?: boolean }) => {
      if (!synapse) throw new Error("Synapse not found");
      if (!address) throw new Error("Address not found");

      setProgress(0);
      setUploadedInfo(null);
      setStatus("Initializing file upload to Filecoin...");

      let fileToUpload = file;
      let encryptedMetadata: UploadedInfo["encryptedMetadata"];

      // Optional encryption step
      if (encrypt) {
        setStatus("Initializing Lit Protocol...");
        setProgress(5);

        try {
          await initLitClient();
          setStatus("Encrypting file with Lit Protocol...");
          setProgress(10);

          const encrypted = await encryptFileWithLit(file, address);

          // Convert ciphertext to a Blob/File for upload
          const encryptedBlob = new Blob([encrypted.ciphertext], {
            type: "application/octet-stream",
          });
          fileToUpload = new File([encryptedBlob], `${file.name}.encrypted`, {
            type: "application/octet-stream",
          });

          encryptedMetadata = {
            dataToEncryptHash: encrypted.dataToEncryptHash,
            originalFileName: encrypted.originalFileName,
            originalFileSize: encrypted.originalFileSize,
            originalFileType: encrypted.originalFileType,
            encryptedAt: encrypted.encryptedAt,
          };

          setStatus("File encrypted successfully!");
          setProgress(15);
        } catch (error) {
          console.error("Encryption error:", error);
          throw new Error(
            `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // 1) Convert File → ArrayBuffer
      const arrayBuffer = await fileToUpload.arrayBuffer();
      // 2) Convert ArrayBuffer → Uint8Array
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);
      // 3) Get dataset
      const datasets = await synapse.storage.findDataSets(address);
      // 4) Check if we have a dataset
      const datasetExists = datasets.length > 0;
      // Include dataset creation fee if no dataset exists
      const includeDatasetCreationFee = !datasetExists;

      // 5) Check if we have enough USDFC to cover the storage costs and deposit if not
      setStatus("Checking USDFC balance and storage allowances...");
      setProgress(encrypt ? 20 : 5);
      await preflightCheck(
        fileToUpload,
        synapse,
        includeDatasetCreationFee,
        setStatus,
        setProgress
      );

      setStatus("Setting up storage service and dataset...");
      setProgress(encrypt ? 30 : 25);

      // 6) Create storage service
      const storageService = await synapse.createStorage({
        withCDN: true,
        callbacks: {
          onDataSetResolved: (info) => {
            console.log("Dataset resolved:", info);
            setStatus("Existing dataset found and resolved");
            setProgress(encrypt ? 35 : 30);
          },
          onDataSetCreationStarted: (transactionResponse, statusUrl) => {
            console.log("Dataset creation started:", transactionResponse);
            console.log("Dataset creation status URL:", statusUrl);
            setStatus("Creating new dataset on blockchain...");
            setProgress(encrypt ? 40 : 35);
          },
          onDataSetCreationProgress: (status) => {
            console.log("Dataset creation progress:", status);
            if (status.transactionSuccess) {
              setStatus(`Dataset transaction confirmed on chain`);
              setProgress(encrypt ? 50 : 45);
            }
            if (status.serverConfirmed) {
              setStatus(`Dataset ready! (${Math.round(status.elapsedMs / 1000)}s)`);
              setProgress(encrypt ? 55 : 50);
            }
          },
          onProviderSelected: (provider) => {
            console.log("Storage provider selected:", provider);
            setStatus(`Storage provider selected (${provider.name})`);
          },
        },
      });

      setStatus("Uploading file to storage provider...");
      setProgress(encrypt ? 60 : 55);
      
      // 7) Upload file to storage provider
      await storageService.upload(uint8ArrayBytes, {
        onUploadComplete: (piece) => {
          setStatus(`File uploaded! Signing msg to add pieces to the dataset`);
          setUploadedInfo((prev) => ({
            ...prev,
            fileName: encrypt ? file.name : fileToUpload.name,
            fileSize: file.size,
            pieceCid: piece.toV1().toString(),
            encrypted: encrypt,
            fileType: file.type || "application/octet-stream",
            dataToEncryptHash: encryptedMetadata?.dataToEncryptHash || "",
            encryptedMetadata: encryptedMetadata,
          }));
          setProgress(encrypt ? 85 : 80);
        },
        onPieceAdded: (transactionResponse) => {
          setStatus(
            `Waiting for transaction to be confirmed on chain ${
              transactionResponse
                ? `(txHash: ${transactionResponse.hash.slice(0, 6)}...${transactionResponse.hash.slice(-4)})`
                : ""
            }`
          );
          if (transactionResponse) {
            console.log("Transaction response:", transactionResponse);
            setUploadedInfo((prev) => ({
              ...prev,
              txHash: transactionResponse?.hash,
            }));
          }
        },
        onPieceConfirmed: () => {
          setStatus("Data pieces added to dataset successfully");
          setProgress(90);
        },
      });

      setProgress(encrypt ? 98 : 95);
    },
    onSuccess: () => {
      setStatus("File successfully stored on Filecoin!");
      setProgress(100);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setStatus(`❌ Upload failed: ${error.message || "Please try again"}`);
      setProgress(0);
    },
  });

  const handleReset = () => {
    setProgress(0);
    setUploadedInfo(null);
    setStatus("");
  };

  return {
    uploadFileMutation: mutation,
    progress,
    uploadedInfo,
    handleReset,
    status,
  };
};


