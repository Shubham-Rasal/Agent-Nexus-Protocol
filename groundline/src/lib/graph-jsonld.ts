import type { Entity, Relation } from './graph-model.js';
import { nodes, edges } from './graph-crdt.js';
import { jsonLdContext } from './jsonld-context.js';



/**
 * Converts a single entity to a JSON-LD node
 */
function entityToJsonLd(entity: Entity): any {
  const jsonLd: any = {
    "@id": `https://groundline.dev/entity/${entity.id}`,
    "@type": "Entity",
    "name": entity.name,
    "entityType": entity.entityType
  };

  if (entity.observations?.length) {
    jsonLd.observations = entity.observations;
  }

  if (entity.properties) {
    jsonLd.properties = entity.properties;
  }

  return jsonLd;
}

/**
 * Converts a single relation to JSON-LD statements
 */
function relationToJsonLd(relation: Relation): any {
  return {
    "@id": `https://groundline.dev/relation/${relation.id}`,
    "@type": "Relation",
    "from": `https://groundline.dev/entity/${relation.from}`,
    "to": `https://groundline.dev/entity/${relation.to}`,
    "relationType": relation.relationType,
    ...(relation.properties ? { "properties": relation.properties } : {})
  };
}

/**
 * Converts the entire graph to a JSON-LD document
 */
export function serializeGraphToJsonLD(): any {
  const graph: any[] = [];

  // Convert all nodes to JSON-LD
  for (const [id, node] of nodes.entries()) {
    graph.push(entityToJsonLd(node as Entity));
  }

  // Convert all edges to JSON-LD
  for (const [id, edge] of edges.entries()) {
    graph.push(relationToJsonLd(edge as Relation));
  }

  return {
    "@context": jsonLdContext["@context"],
    "@graph": graph
  };
}

/**
 * Optional: Validate and compact JSON-LD using jsonld library
 * Note: This requires the jsonld package to be installed
 */
export async function validateAndCompactJsonLD(jsonLdDoc: any): Promise<any> {
  try {
    const { default: jsonld } = await import('jsonld');
    return await jsonld.compact(jsonLdDoc, jsonLdDoc['@context']);
  } catch (error) {
    console.error('Failed to validate/compact JSON-LD:', error);
    return jsonLdDoc;
  }
} 