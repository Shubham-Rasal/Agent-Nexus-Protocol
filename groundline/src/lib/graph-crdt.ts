import * as Y from 'yjs';
import type { Entity, Relation } from './graph-model.js';
import * as fs from 'fs';

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
  meta?: Record<string, any>; // For future extensibility
}

const provenanceLog: ProvenanceLogEntry[] = [];

function logChange(entry: Omit<ProvenanceLogEntry, 'timestamp'>) {
  provenanceLog.push({ ...entry, timestamp: Date.now() });
}

// Add a node (Entity) to the nodes map
export function addNode(entity: Entity) {
  if (!entity.id) throw new Error('Entity must have an id');
  nodes.set(entity.id, entity);
  logChange({ action: 'add', objectType: 'node', id: entity.id, data: entity });
}

// Edit a node (Entity) in the nodes map
export function editNode(entity: Entity) {
  if (!entity.id) throw new Error('Entity must have an id');
  if (!nodes.has(entity.id)) throw new Error('Node does not exist');
  nodes.set(entity.id, entity);
  logChange({ action: 'edit', objectType: 'node', id: entity.id, data: entity });
}

// Delete a node by id
export function deleteNode(id: string) {
  nodes.delete(id);
  logChange({ action: 'delete', objectType: 'node', id });
}

// Add an edge (Relation) to the edges map
export function addEdge(relation: Relation) {
  const edgeId = `${relation.from}->${relation.to}:${relation.relationType}`;
  edges.set(edgeId, relation);
  logChange({ action: 'add', objectType: 'edge', id: edgeId, data: relation });
}

// Edit an edge (Relation) in the edges map
export function editEdge(relation: Relation) {
  const edgeId = `${relation.from}->${relation.to}:${relation.relationType}`;
  if (!edges.has(edgeId)) throw new Error('Edge does not exist');
  edges.set(edgeId, relation);
  logChange({ action: 'edit', objectType: 'edge', id: edgeId, data: relation });
}

// Delete an edge by id (composite key)
export function deleteEdge(edgeId: string) {
  edges.delete(edgeId);
  logChange({ action: 'delete', objectType: 'edge', id: edgeId });
}

// Save the current Y.Doc state to a file (as base64-encoded update)
export function saveGraphToFile(filepath: string) {
  const update = Y.encodeStateAsUpdate(graphDoc);
  fs.writeFileSync(filepath, update);
}

// Load the Y.Doc state from a file (base64-encoded update)
export function loadGraphFromFile(filepath: string) {
  if (!fs.existsSync(filepath)) return;
  const update = fs.readFileSync(filepath);
  Y.applyUpdate(graphDoc, update);
}

// Export functions to get and clear the provenance log
export function getProvenanceLog() {
  return provenanceLog.slice();
}

export function clearProvenanceLog() {
  provenanceLog.length = 0;
} 