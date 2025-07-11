import type { Entity, Relation } from './graph-model.js';
import { addNode, editNode, deleteNode, addEdge, editEdge, deleteEdge, getProvenanceLog } from './graph-crdt.js';
import { createGraphIPFSManager} from './graph-ipfs.js';
import { IPFSConfig } from './ipfs.js';
import type { ExternalEntity, ExternalRelation } from './kg-adapters/adapter.js';
import { WikidataAdapter } from './kg-adapters/wikidata';
import { DBpediaAdapter } from './kg-adapters/dbpedia.js';
import { OpenAlexAdapter } from './kg-adapters/openalex.js';
import { serializeGraphToJsonLD, validateAndCompactJsonLD } from './graph-jsonld.js';

export interface GraphDBConfig {
  ipfs?: IPFSConfig;
  enabledAdapters?: ('wikidata' | 'dbpedia' | 'openalex')[];
}

export class GraphDB {
  private ipfsManager;
  private adapters: Record<string, any> = {};

  constructor(private config: GraphDBConfig = {}) {
    // Initialize IPFS manager if config provided
    if (config.ipfs) {
      this.ipfsManager = createGraphIPFSManager(config.ipfs);
    }

    // Initialize enabled knowledge graph adapters
    const enabledAdapters = config.enabledAdapters || ['wikidata'];
    enabledAdapters.forEach(adapter => {
      switch (adapter) {
        case 'wikidata':
          this.adapters.wikidata = new WikidataAdapter();
          break;
        case 'dbpedia':
          this.adapters.dbpedia = new DBpediaAdapter();
          break;
        case 'openalex':
          this.adapters.openalex = new OpenAlexAdapter();
          break;
      }
    });
  }

  /**
   * Initialize the GraphDB instance
   */
  async initialize(): Promise<void> {
    if (this.ipfsManager) {
      await this.ipfsManager.initialize();
    }
  }

  /**
   * Create one or more entities in the graph
   */
  async createEntities(entities: Entity | Entity[]): Promise<string[]> {
    const entityArray = Array.isArray(entities) ? entities : [entities];
    const ids: string[] = [];

    for (const entity of entityArray) {
      // Generate ID if not provided
      if (!entity.id) {
        entity.id = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      addNode(entity);
      ids.push(entity.id);
    }

    return ids;
  }

  /**
   * Create one or more relations between entities
   */
  async createRelations(relations: Relation | Relation[]): Promise<string[]> {
    const relationArray = Array.isArray(relations) ? relations : [relations];
    const ids: string[] = [];

    for (const relation of relationArray) {
      // Generate ID if not provided
      if (!relation.id) {
        relation.id = `relation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      addEdge(relation);
      ids.push(relation.id);
    }

    return ids;
  }

  /**
   * Add observations to an existing entity
   */
  async addObservations(entityId: string, observations: string[]): Promise<void> {
    const entity = this.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    entity.observations = [...(entity.observations || []), ...observations];
    editNode(entity);
  }

  /**
   * Delete entities and their associated relations
   */
  async deleteEntities(entityIds: string | string[]): Promise<void> {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    for (const id of ids) {
      deleteNode(id);
      // TODO: Delete associated relations
    }
  }

  /**
   * Create a snapshot of the current graph state and store it on IPFS
   */
  async snapshotGraph(): Promise<string> {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }
    return await this.ipfsManager.snapshotToIPFS();
  }

  /**
   * Pin a graph snapshot to ensure persistence
   */
  async pinSnapshot(cid: string): Promise<void> {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }
    // TODO: Implement pinning logic
  }

  /**
   * Get the latest version of a graph from IPFS
   */
  async resolveLatest(cid: string): Promise<void> {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }
    await this.ipfsManager.loadFromIPFS(cid);
  }

  /**
   * Get the current graph state
   */
  getGraph() {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }
    return this.ipfsManager.getGraphState();
  }

  /**
   * Get provenance information for the graph
   */
  getProvenance(): any[] {
    return getProvenanceLog();
  }

  /**
   * Import entities and relations from an external knowledge graph
   */
  async importExternalKG(source: string, query: string): Promise<{
    entities: ExternalEntity[];
    relations: ExternalRelation[];
  }> {
    const adapter = this.adapters[source];
    if (!adapter) {
      throw new Error(`Knowledge graph adapter '${source}' not found`);
    }

    const entities = await adapter.searchEntities(query);
    const relations: ExternalRelation[] = [];

    // For each entity, get its relations
    for (const entity of entities) {
      const entityRelations = await adapter.getEntityRelations(entity.id);
      relations.push(...entityRelations);
    }

    return { entities, relations };
  }

  /**
   * Load a graph from IPFS by its CID
   */
  async loadGraphByCID(cid: string): Promise<void> {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }
    await this.ipfsManager.loadFromIPFS(cid);
  }

  /**
   * Get an entity by its ID
   */
  private getEntity(id: string): Entity | undefined {
    const state = this.ipfsManager?.getGraphState();
    return state?.nodes.find(([nodeId]) => nodeId === id)?.[1] as Entity | undefined;
  }

  /**
   * Export the current graph as JSON-LD
   */
  async exportAsJsonLD(options: { validate?: boolean; publishToIPFS?: boolean } = {}): Promise<{
    jsonLd: any;
    ipfsCid?: string;
  }> {
    // Convert graph to JSON-LD
    let jsonLd = serializeGraphToJsonLD();

    // Optionally validate and compact
    if (options.validate) {
      jsonLd = await validateAndCompactJsonLD(jsonLd);
    }

    // Optionally publish to IPFS
    let ipfsCid: string | undefined;
    if (options.publishToIPFS) {
      if (!this.ipfsManager) {
        throw new Error('IPFS support not enabled');
      }

      // Get provenance information
      const provenance = this.getProvenance();

      // Store the JSON-LD document and provenance as special entities
      const entities = new Map<string, Entity>();
      entities.set('jsonld', {
        id: 'jsonld',
        name: 'JSON-LD Document',
        entityType: 'JsonLdDocument',
        observations: [JSON.stringify(jsonLd)]
      });
      entities.set('provenance', {
        id: 'provenance',
        name: 'Provenance Log',
        entityType: 'ProvenanceLog',
        observations: [JSON.stringify(provenance)]
      });

      // Create a snapshot with the JSON-LD document and provenance
      console.log('✅ Creating snapshot with JSON-LD document and provenance');
      ipfsCid = await this.ipfsManager.snapshotToIPFS();
    }

    return { jsonLd, ipfsCid };
  }

  /**
   * Load a JSON-LD document from IPFS
   */
  async loadJsonLDFromIPFS(cid: string): Promise<{
    jsonLd: any;
    provenance?: any[];
  }> {
    if (!this.ipfsManager) {
      throw new Error('IPFS support not enabled');
    }

    // Load the snapshot
    await this.ipfsManager.loadFromIPFS(cid);
    
    // Get the JSON-LD document and provenance from the special entities
    const state = this.ipfsManager.getGraphState();
    console.log('✅ State:', state);

    // Extract JSON-LD and provenance data
    const jsonLdEntity = state?.nodes.find(([id]) => id === 'jsonld')?.[1] as Entity | undefined;
    const provenanceEntity = state?.nodes.find(([id]) => id === 'provenance')?.[1] as Entity | undefined;

    const jsonLd = jsonLdEntity?.observations?.[0] ? JSON.parse(jsonLdEntity.observations[0]) : undefined;
    const provenance = provenanceEntity?.observations?.[0] ? JSON.parse(provenanceEntity.observations[0]) : undefined;

    if (!jsonLd) {
      throw new Error('No JSON-LD document found in snapshot');
    }

    return { jsonLd, provenance };
  }
}

// Export a factory function for creating GraphDB instances
export function createGraphDB(config?: GraphDBConfig): GraphDB {
  return new GraphDB(config);
} 