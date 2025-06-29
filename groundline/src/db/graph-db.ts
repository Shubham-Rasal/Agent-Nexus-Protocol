import type { OrbitDBInstance } from "@orbitdb/core";
import type { Entity, Relation } from "../types/graph.js";
import { validateEntity, validateRelation } from "../types/schema.js";

type DocumentStore = Awaited<ReturnType<OrbitDBInstance["open"]>>;

export class GraphDB {
  private entityStore: DocumentStore;
  private relationStore: DocumentStore;

  constructor(entityStore: DocumentStore, relationStore: DocumentStore) {
    this.entityStore = entityStore;
    this.relationStore = relationStore;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Add a new entity
   */
  async addEntity(entity: unknown): Promise<string> {
    const validation = validateEntity(entity);
    if (!validation.success) {
      throw new Error(`Invalid entity: ${validation.error.message}`);
    }

    const _id = this.generateId();
    const documentWithId = { _id, ...validation.data };
    await this.entityStore.put(documentWithId);
    return _id;
  }

  /**
   * Add a new relation
   */
  async addRelation(relation: unknown): Promise<string> {
    const validation = validateRelation(relation);
    if (!validation.success) {
      throw new Error(`Invalid relation: ${validation.error.message}`);
    }

    const _id = this.generateId();
    const documentWithId = { _id, ...validation.data };
    await this.relationStore.put(documentWithId);
    return _id;
  }

  /**
   * Delete a relation by ID
   */
  async deleteRelation(id: string): Promise<boolean> {
    const relation = await this.relationStore.get(id);
    if (!relation) return false;

    await this.relationStore.del(id);
    return true;
  }

  /**
   * Get a relation by ID
   */
  async getRelationById(
    id: string,
  ): Promise<(Relation & { _id: string }) | null> {
    const relation = await this.relationStore.get(id);
    return relation as (Relation & { _id: string }) | null;
  }

  /**
   * Get an entity by ID
   */
  async getEntityById(id: string): Promise<(Entity & { _id: string }) | null> {
    const entity = await this.entityStore.get(id);
    return entity as (Entity & { _id: string }) | null;
  }

  /**
   * Get all relations
   */
  async getAllRelations(): Promise<(Relation & { _id: string })[]> {
    const relations = await this.relationStore.all();
    return Object.entries(relations).map(([id, relation]) => ({
      _id: id,
      ...(relation as Relation),
    }));
  }

  /**
   * Get all entities
   */
  async getAllEntities(): Promise<(Entity & { _id: string })[]> {
    const entities = await this.entityStore.all();
    return Object.entries(entities).map(([id, entity]) => ({
      _id: id,
      ...(entity as Entity),
    }));
  }

  /**
   * Search for entities by name or type using simple string matching
   */
  async searchEntities(query: string): Promise<(Entity & { _id: string })[]> {
    const allEntities = await this.getAllEntities();
    return allEntities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(query.toLowerCase()) ||
        entity.entityType.toLowerCase().includes(query.toLowerCase()),
    );
  }

  /**
   * Get all relations for an entity (both incoming and outgoing)
   */
  async getRelationsForEntity(
    entityId: string,
  ): Promise<(Relation & { _id: string })[]> {
    const allRelations = await this.getAllRelations();
    return allRelations.filter(
      (relation) => relation.from === entityId || relation.to === entityId,
    );
  }

  /**
   * Get all connected entities (neighbors) of an entity
   */
  async getConnectedEntities(
    entityId: string,
  ): Promise<
    { entity: Entity & { _id: string }; relation: Relation & { _id: string } }[]
  > {
    const relations = await this.getRelationsForEntity(entityId);
    const connectedEntities = await Promise.all(
      relations.map(async (relation) => {
        const connectedId =
          relation.from === entityId ? relation.to : relation.from;
        const entity = await this.getEntityById(connectedId);
        return entity ? { entity, relation } : null;
      }),
    );
    return connectedEntities.filter(
      (
        item,
      ): item is {
        entity: Entity & { _id: string };
        relation: Relation & { _id: string };
      } => item !== null,
    );
  }

  /**
   * Traverse the graph starting from an entity, up to a certain depth
   */
  async traverseGraph(
    startEntityId: string,
    maxDepth: number = 2,
  ): Promise<
    Map<
      string,
      {
        entity: Entity & { _id: string };
        relations: (Relation & { _id: string })[];
      }
    >
  > {
    const visited = new Map<
      string,
      {
        entity: Entity & { _id: string };
        relations: (Relation & { _id: string })[];
      }
    >();
    const queue: { id: string; depth: number }[] = [
      { id: startEntityId, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const entity = await this.getEntityById(current.id);
      if (!entity || visited.has(current.id)) continue;

      const relations = await this.getRelationsForEntity(current.id);
      visited.set(current.id, { entity, relations });

      // Add unvisited neighbors to queue
      for (const relation of relations) {
        const neighborId =
          relation.from === current.id ? relation.to : relation.from;
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }

    return visited;
  }
}
