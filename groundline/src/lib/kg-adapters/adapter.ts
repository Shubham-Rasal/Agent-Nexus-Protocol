import type { Entity, Relation } from "../graph-model.js";

export interface ExternalEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  source: string;
}

export interface ExternalRelation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
  source: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  language?: string;
  filters?: Record<string, any>;
}

export interface KGAdapter {
  name: string;
  description: string;

  /**
   * Search for entities in the external knowledge graph
   */
  searchEntities(
    query: string,
    options?: QueryOptions,
  ): Promise<ExternalEntity[]>;

  /**
   * Get relations for a specific entity
   */
  getEntityRelations(
    entityId: string,
    options?: QueryOptions,
  ): Promise<ExternalRelation[]>;

  /**
   * Transform external entity to our internal format
   */
  transformEntity(external: ExternalEntity): Entity;

  /**
   * Transform external relation to our internal format
   */
  transformRelation(external: ExternalRelation): Relation;
}

export abstract class BaseKGAdapter implements KGAdapter {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}

  abstract searchEntities(
    query: string,
    options?: QueryOptions,
  ): Promise<ExternalEntity[]>;
  abstract getEntityRelations(
    entityId: string,
    options?: QueryOptions,
  ): Promise<ExternalRelation[]>;

  transformEntity(external: ExternalEntity): Entity {
    return {
      name: external.name,
      entityType: external.type,
      observations: [
        `Imported from ${external.source}`,
        external.description || "",
        ...Object.entries(external.properties || {}).map(
          ([key, value]) => `${key}: ${value}`,
        ),
      ].filter(Boolean),
    };
  }

  transformRelation(external: ExternalRelation): Relation {
    return {
      from: external.from,
      to: external.to,
      relationType: external.type,
    };
  }
}
