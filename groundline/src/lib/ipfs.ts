import { Synapse, RPC_URLS, type StorageService, TOKENS, CONTRACT_ADDRESSES, PandoraService } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import type { Entity, Relation } from './graph-model.js';

// Constants
const PROOF_SET_CREATION_FEE = ethers.parseUnits('5', 18); // 5 USDFC for proof set
const BUFFER_AMOUNT = ethers.parseUnits('5', 18); // 5 USDFC buffer for gas fees

export interface IPFSConfig {
  privateKey?: string;
  rpcURL?: string;
  authorization?: string;
  withCDN?: boolean;
}

export interface GraphSnapshot {
  nodes: Map<string, Entity>;
  edges: Map<string, Relation>;
  timestamp: number;
  version: string;
  provenance: any[];
}

export class IPFSClient {
  private synapse!: Synapse;
  private storage!: StorageService;
  
  constructor(private config: IPFSConfig = {}) {}

  /**
   * Performs preflight checks to ensure sufficient USDFC balance and allowances
   * @param dataSize Size of data to be stored
   * @param withProofset Whether a new proofset needs to be created
   */
  private async performPreflightCheck(dataSize: number, withProofset: boolean): Promise<void> {
    const network = this.synapse.getNetwork();
    const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[network];
    
    const signer = this.synapse.getSigner();
    if (!signer || !signer.provider) {
      throw new Error("Provider not found");
    }
    
    // Initialize Pandora service for allowance checks
    const pandoraService = new PandoraService(
      signer.provider,
      pandoraAddress
    );

    // Check if current allowance is sufficient
    const preflight = await pandoraService.checkAllowanceForStorage(
      dataSize,
      this.config.withCDN || false,
      this.synapse.payments
    );

    // If allowance is insufficient, handle deposit and approval
    if (!preflight.sufficient) {
      // Calculate total allowance needed including proofset creation fee if required
      const proofSetCreationFee = withProofset ? PROOF_SET_CREATION_FEE : BigInt(0);
      const allowanceNeeded = preflight.lockupAllowanceNeeded + proofSetCreationFee + BUFFER_AMOUNT;

      console.log('Setting up USDFC payments:');
      console.log('- Base allowance:', ethers.formatUnits(preflight.lockupAllowanceNeeded, 18), 'USDFC');
      if (withProofset) {
        console.log('- Proof set fee:', ethers.formatUnits(PROOF_SET_CREATION_FEE, 18), 'USDFC');
      }
      console.log('- Buffer amount:', ethers.formatUnits(BUFFER_AMOUNT, 18), 'USDFC');
      console.log('- Total needed:', ethers.formatUnits(allowanceNeeded, 18), 'USDFC');

      // Step 1: Deposit USDFC to cover storage costs
      console.log('Depositing USDFC...');
      await this.synapse.payments.deposit(allowanceNeeded);
      console.log('USDFC deposited successfully');

      // Step 2: Approve Pandora service to spend USDFC at specified rates
      console.log('Approving Pandora service...');
      await this.synapse.payments.approveService(
        pandoraAddress,
        preflight.rateAllowanceNeeded,
        allowanceNeeded
      );
      console.log('Pandora service approved successfully');
    } else {
      console.log('✓ Sufficient USDFC allowance already available');
    }
  }

  /**
   * Initialize the IPFS client with Synapse SDK
   */
  async initialize(): Promise<void> {
    // Initialize Synapse SDK
    this.synapse = await Synapse.create({
      privateKey : this.config.privateKey,
      rpcURL: this.config.rpcURL || RPC_URLS.calibration.websocket,
      withCDN: this.config.withCDN
    });

    // Perform initial preflight check with minimum size for proof set creation
    await this.performPreflightCheck(1024, true); // 1KB minimum size

    // Create storage service with callbacks
    try {
      this.storage = await this.synapse.createStorage({
        callbacks: {
          onProviderSelected: (provider) => {
            console.log(`✓ Selected storage provider: ${provider.owner}`);
            console.log(`  PDP URL: ${provider.pdpUrl}`);
          },
          onProofSetResolved: (info) => {
            if (info.isExisting) {
              console.log(`✓ Using existing proof set: ${info.proofSetId}`);
            } else {
              console.log(`✓ Created new proof set: ${info.proofSetId}`);
            }
          },
          onProofSetCreationStarted: (transaction, statusUrl) => {
            console.log(`  Creating proof set, tx: ${transaction.hash}`);
          },
          onProofSetCreationProgress: (status) => {
            if (status.transactionMined && !status.proofSetLive) {
              console.log('  Transaction mined, waiting for proof set to be live...');
            }
          },
        
          
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Storage service creation failed:', error);
      throw new Error(`Failed to create storage service: ${message}`);
    }
  }

  /**
   * Upload graph snapshot to IPFS
   * @param snapshot Graph data to store
   * @returns CID of the stored content
   */
  async uploadSnapshot(snapshot: GraphSnapshot): Promise<string> {
    try {
      // Convert Maps to plain objects for JSON serialization
      const serializedSnapshot = {
        ...snapshot,
        nodes: Object.fromEntries(snapshot.nodes),
        edges: Object.fromEntries(snapshot.edges)
      };

      // Convert to Uint8Array for upload
      const data = new TextEncoder().encode(JSON.stringify(serializedSnapshot));
      
      // Create a promise that resolves when upload is complete
      return new Promise((resolve, reject) => {
        this.storage.upload(data, {
          onUploadComplete(commp) {
            console.log(`✓ Upload complete: ${commp}`);
            resolve(commp.toString());
            return commp.toString();
          },
        }).catch(reject);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload snapshot: ${message}`);
    }
  }

  /**
   * Retrieve graph snapshot from IPFS
   * @param cid Content identifier (CommP)
   * @returns Graph snapshot data
   */
  async getSnapshot(cid: string): Promise<GraphSnapshot> {
    try {
      // Download data from IPFS via Synapse
      const data = await this.storage.providerDownload(cid);
      
      // Parse the JSON data
      const serializedSnapshot = JSON.parse(new TextDecoder().decode(data));
      
      // Convert plain objects back to Maps
      return {
        ...serializedSnapshot,
        nodes: new Map(Object.entries(serializedSnapshot.nodes)),
        edges: new Map(Object.entries(serializedSnapshot.edges))
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve snapshot: ${message}`);
    }
  }

  /**
   * Pin content to ensure persistence
   * @param cid Content identifier to pin
   */
  async pinContent(cid: string): Promise<void> {
    try {
      // In Synapse, content is automatically pinned by the storage provider
      // We can optionally verify the piece is available
      await this.storage.providerDownload(cid, { onlyVerify: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify content: ${message}`);
    }
  }
}

// Export a factory function for creating IPFS client instances
export function createIPFSClient(config?: IPFSConfig): IPFSClient {
  return new IPFSClient(config);
} 