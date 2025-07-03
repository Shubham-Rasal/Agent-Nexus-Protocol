import { Synapse, RPC_URLS, type StorageService } from '@filoz/synapse-sdk';
import type { Entity, Relation } from './graph-model.js';

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
}

export class IPFSClient {
  private synapse!: Synapse;
  private storage!: StorageService;
  
  constructor(private config: IPFSConfig = {}) {}

  /**
   * Initialize the IPFS client with Synapse SDK
   */
  async initialize(): Promise<void> {
    // Initialize Synapse SDK
    this.synapse = await Synapse.create({
      privateKey: this.config.privateKey,
      rpcURL: this.config.rpcURL || RPC_URLS.calibration.websocket,
      authorization: this.config.authorization,
      withCDN: this.config.withCDN
    });

    // Create storage service
    this.storage = await this.synapse.createStorage();
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
      
      // Upload to IPFS via Synapse
      const result = await this.storage.upload(data);
      
      return result.commp.toString(); // Convert LegacyPieceLink to string
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