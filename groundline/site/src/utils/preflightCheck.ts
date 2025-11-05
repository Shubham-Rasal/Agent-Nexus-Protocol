import { Synapse } from "@filoz/synapse-sdk";
import { ethers } from "ethers";

/**
 * Preflight check to ensure user has sufficient USDFC balance and allowances
 * for storage operations. This will check and handle deposits/approvals if needed.
 */
export async function preflightCheck(
  file: File,
  synapse: Synapse,
  includeDatasetCreationFee: boolean,
  setStatus?: (status: string) => void,
  setProgress?: (progress: number) => void
): Promise<void> {
  const updateStatus = (message: string) => {
    if (setStatus) setStatus(message);
    console.log(message);
  };

  const updateProgress = (value: number) => {
    if (setProgress) setProgress(value);
  };

  try {
    updateStatus("Calculating storage costs...");
    
    // Get warm storage address
    const warmStorageAddress = await synapse.getWarmStorageAddress();
    
    // Estimate storage costs for the file
    const fileSize = file.size;
    
    updateProgress(15);
    
    // Check if user has sufficient balance and allowances
    const preflight = await synapse.storage.preflightUpload(
      fileSize,
    );
    
    updateProgress(30);
    
    if (!preflight.estimatedCost.perMonth) {
      updateStatus(`Need ${ethers.formatUnits(preflight.estimatedCost.perMonth, 18)} USDFC total`);
      updateProgress(40);
      
      // Check current balance
      const balance = await synapse.payments.walletBalance();
      if (balance < preflight.estimatedCost.perMonth) {
        const depositAmount = preflight.estimatedCost.perMonth - balance;
        updateStatus(`Depositing ${ethers.formatUnits(depositAmount, 18)} USDFC...`);
        updateProgress(50);
        
        const depositTx = await synapse.payments.deposit(depositAmount);
        await depositTx.wait();
        updateStatus("USDFC deposited successfully");
        updateProgress(60);
      }
      
      // Approve service if needed
      if (preflight.estimatedCost.perEpoch && preflight.estimatedCost.perEpoch > BigInt(0)) {
        updateStatus("Approving Warm Storage service...");
        updateProgress(70);
        
        // Use reasonable defaults for approval
        
        const approveTx = await synapse.payments.approveService(
          warmStorageAddress,
          preflight.estimatedCost.perEpoch,
          preflight.estimatedCost.perMonth,
          preflight.estimatedCost.perEpoch 
        );
        await approveTx.wait();
        
        updateStatus("Service approved successfully");
        updateProgress(80);
      }
      
      updateProgress(90);
    } else {
      updateStatus("✓ Sufficient USDFC balance and allowances available");
      updateProgress(50);
    }
    
    updateProgress(100);
  } catch (error) {
    console.error("Preflight check error:", error);
    throw new Error(
      `Preflight check failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

