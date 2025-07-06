import * as Y from 'yjs';
import type { Entity, Relation } from './graph-model.js';
// import * as fs from 'fs';

// Create a new Y.Doc instance
export const graphDoc = new Y.Doc();

// 'nodes' and 'edges' are Y.Maps for storing entities and relations
export const nodes = graphDoc.getMap('nodes');
export const edges = graphDoc.getMap('edges');

// Optionally, export a function to initialize or reset the doc
export function initGraphDoc() {
  graphDoc.getMap('nodes').clear();
  graphDoc.getMap('edges').clear();
}

// Provenance change log entry type
export interface ProvenanceLogEntry {
  timestamp: number;
  action: 'add' | 'edit' | 'delete';
  objectType: 'node' | 'edge';
  id: string;
  data?: any; // Optionally store the full object or diff
  meta?: {
    userId?: string;
    clientId?: string;
    batchId?: string;
    parentOpId?: string;
    reason?: string;
    source?: 'api' | 'ui' | 'batch' | 'sync';
    confidence?: number;
    dataSource?: string;
    validationStatus?: 'valid' | 'pending' | 'invalid';
    schemaVersion?: string;
    previousStateHash?: string;
    namespace?: string;
    labels?: string[];
    custom?: Record<string, any>; // For additional custom metadata
  };
}

const provenanceLog: ProvenanceLogEntry[] = [];

// Enhanced logging function with metadata support
function logChange(entry: Omit<ProvenanceLogEntry, 'timestamp'>, metadata: Partial<ProvenanceLogEntry['meta']> = {}) {
  const defaultMeta = {
    schemaVersion: '1.0', // Current schema version
    source: 'api' as const,
    validationStatus: 'valid' as const
  };

  provenanceLog.push({
    ...entry,
    timestamp: Date.now(),
    meta: {
      ...defaultMeta,
      ...metadata
    }
  });
}

// Add a node (Entity) to the nodes map with metadata support
export function addNode(entity: Entity, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  if (!entity.id) throw new Error('Entity must have an id');
  nodes.set(entity.id, entity);
  logChange({ 
    action: 'add', 
    objectType: 'node', 
    id: entity.id, 
    data: entity 
  }, metadata);
}

// Edit a node (Entity) in the nodes map with metadata support
export function editNode(entity: Entity, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  if (!entity.id) throw new Error('Entity must have an id');
  if (!nodes.has(entity.id)) throw new Error('Node does not exist');
  nodes.set(entity.id, entity);
  logChange({ 
    action: 'edit', 
    objectType: 'node', 
    id: entity.id, 
    data: entity 
  }, metadata);
}

// Delete a node by id with metadata support
export function deleteNode(id: string, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  nodes.delete(id);
  logChange({ 
    action: 'delete', 
    objectType: 'node', 
    id 
  }, metadata);
}

// Add an edge (Relation) to the edges map with metadata support
export function addEdge(relation: Relation, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  const edgeId = `${relation.from}->${relation.to}:${relation.relationType}`;
  edges.set(edgeId, relation);
  logChange({ 
    action: 'add', 
    objectType: 'edge', 
    id: edgeId, 
    data: relation 
  }, metadata);
}

// Edit an edge (Relation) in the edges map with metadata support
export function editEdge(relation: Relation, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  const edgeId = `${relation.from}->${relation.to}:${relation.relationType}`;
  if (!edges.has(edgeId)) throw new Error('Edge does not exist');
  edges.set(edgeId, relation);
  logChange({ 
    action: 'edit', 
    objectType: 'edge', 
    id: edgeId, 
    data: relation 
  }, metadata);
}

// Delete an edge by id (composite key) with metadata support
export function deleteEdge(edgeId: string, metadata?: Partial<ProvenanceLogEntry['meta']>) {
  edges.delete(edgeId);
  logChange({ 
    action: 'delete', 
    objectType: 'edge', 
    id: edgeId 
  }, metadata);
}

// Export functions to get and clear the provenance log
export function getProvenanceLog() {
  return provenanceLog.slice();
}

export function clearProvenanceLog() {
  provenanceLog.length = 0;
} 