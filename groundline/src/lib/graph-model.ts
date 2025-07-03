// Internal graph model for the MCP-compatible knowledge graph

export interface Entity {
  id?: string; // Optional, as some adapters may not provide it
  name: string;
  entityType: string;
  observations?: string[];
  properties?: Record<string, any>;
}

export interface Relation {
  id?: string; // Optional, as some adapters may not provide it
  from: string;
  to: string;
  relationType: string;
  properties?: Record<string, any>;
} 