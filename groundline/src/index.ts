// Core exports
export { createGraphDB } from './lib/graph-api';
export { createGraphIPFSManager, GraphIPFSManager } from './lib/graph-ipfs';
export { jsonLdContext } from './lib/jsonld-context';

// Knowledge Graph Adapters
export { WikidataAdapter } from './lib/kg-adapters/wikidata';
export { DBpediaAdapter } from './lib/kg-adapters/dbpedia';
export { OpenAlexAdapter } from './lib/kg-adapters/openalex';
export { KGAdapter } from './lib/kg-adapters/adapter';

// Types
export type { Entity, Relation } from './lib/graph-model';
export type { IPFSConfig, GraphSnapshot } from './lib/ipfs';
