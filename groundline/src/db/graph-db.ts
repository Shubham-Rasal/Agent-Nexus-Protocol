import { createHelia } from "helia";
import { CID } from "multiformats/cid";
import type { Entity, Relation } from "../types/graph.js";
import { validateEntity, validateRelation } from "../types/schema.js";

// Placeholder: You should initialize Helia/IPFS elsewhere and pass the instance in
let ipfs: any = null;
export function setIPFSInstance(instance: any) {
  ipfs = instance;
}

export class GraphDB {
  // Entities and relations are stored as JSON objects in IPFS

  async addEntity(entity: unknown): Promise<string> {
    const validation = validateEntity(entity);
    if (!validation.success) {
      throw new Error(`Invalid entity: ${validation.error.message}`);
    }
    const data = JSON.stringify(validation.data);
    const { cid } = await ipfs.add(data);
    return cid.toString();
  }

  async addRelation(relation: unknown): Promise<string> {
    const validation = validateRelation(relation);
    if (!validation.success) {
      throw new Error(`Invalid relation: ${validation.error.message}`);
    }
    const data = JSON.stringify(validation.data);
    const { cid } = await ipfs.add(data);
    return cid.toString();
  }

  async getEntityById(cid: string): Promise<(Entity & { _id: string }) | null> {
    try {
      const stream = ipfs.cat(cid);
      let data = "";
      for await (const chunk of stream) {
        data += new TextDecoder().decode(chunk);
      }
      return { ...(JSON.parse(data)), _id: cid };
    } catch {
      return null;
    }
  }

  async getRelationById(cid: string): Promise<(Relation & { _id: string }) | null> {
    try {
      const stream = ipfs.cat(cid);
      let data = "";
      for await (const chunk of stream) {
        data += new TextDecoder().decode(chunk);
      }
      return { ...(JSON.parse(data)), _id: cid };
    } catch {
      return null;
    }
  }

  // The following are placeholders for more advanced graph operations
  async getAllEntities(): Promise<(Entity & { _id: string })[]> {
    // You would need to maintain a list of entity CIDs elsewhere (e.g., in a root object or index)
    return [];
  }

  async getAllRelations(): Promise<(Relation & { _id: string })[]> {
    // You would need to maintain a list of relation CIDs elsewhere
    return [];
  }

  async searchEntities(query: string): Promise<(Entity & { _id: string })[]> {
    // Implement search logic using getAllEntities and filter
    return [];
  }

  async getRelationsForEntity(entityId: string): Promise<(Relation & { _id: string })[]> {
    // Implement logic to find relations for a given entity
    return [];
  }

  async traverseGraph(startEntityId: string, maxDepth: number = 2): Promise<Map<string, { entity: Entity & { _id: string }; relations: (Relation & { _id: string })[] }>> {
    // Implement graph traversal using IPFS data
    return new Map();
  }
}
