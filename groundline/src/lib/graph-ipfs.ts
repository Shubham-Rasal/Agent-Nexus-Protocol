import * as Y from 'yjs';
import { graphDoc, nodes, edges, ProvenanceLogEntry, getProvenanceLog } from './graph-crdt.js';
import { createIPFSClient, type IPFSConfig, type GraphSnapshot } from './ipfs.js';
import type { Entity, Relation } from './graph-model.js';

export class GraphIPFSManager {
  private ipfsClient;

  constructor(ipfsConfig?: IPFSConfig) {
    this.ipfsClient = createIPFSClient(ipfsConfig);
  }

  /**
   * Initialize the IPFS client
   */
  async initialize(): Promise<void> {
    await this.ipfsClient.initialize();
  }

  /**
   * Create a snapshot of the current graph state and upload to IPFS
   * @returns CID of the uploaded snapshot
   */
  async snapshotToIPFS(): Promise<string> {
    // Create snapshot from current graph state
    const snapshot: GraphSnapshot = {
      nodes: new Map(nodes.entries() as Iterable<[string, Entity]>),
      edges: new Map(edges.entries() as Iterable<[string, Relation]>),
      timestamp: Date.now(),
      version: '1.0.0',
      provenance: getProvenanceLog()
    };

    // Upload to IPFS
    return await this.ipfsClient.uploadSnapshot(snapshot);
  }

  /**
   * Load a graph snapshot from IPFS and apply it to the current graph
   * @param cid Content identifier of the snapshot
   */
  async loadFromIPFS(cid: string): Promise<void> {
    // Get snapshot from IPFS
    const snapshot = await this.ipfsClient.getSnapshot(cid);

    // Clear current graph state
    nodes.clear();
    edges.clear();

    // Apply snapshot data to graph
    snapshot.nodes.forEach((value, key) => nodes.set(key, value));
    snapshot.edges.forEach((value, key) => edges.set(key, value));
  }

  /**
   * Get the current graph state with provenance information
   */
  getGraphState() {
    return {
      nodes: Array.from(nodes.entries()),
      edges: Array.from(edges.entries()),
      provenance: getProvenanceLog()
    };
  }
}

// Export a factory function for creating GraphIPFSManager instances
export function createGraphIPFSManager(config?: IPFSConfig): GraphIPFSManager {
  return new GraphIPFSManager(config);
} 