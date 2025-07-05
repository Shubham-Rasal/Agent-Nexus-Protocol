# Groundline GraphDB

A powerful graph database with IPFS persistence and support for multiple external knowledge graph sources.

## Features

- 🔄 IPFS Integration for decentralized storage
- 🌐 Support for multiple knowledge graph sources (Wikidata, DBpedia, OpenAlex)
- 📊 Graph manipulation and querying
- 🔗 JSON-LD context support

## Installation

```bash
npm install groundline-mcp
```

## Quick Start

```typescript
import { createGraphDB, createGraphIPFSManager } from 'groundline-mcp';

async function main() {
  // Initialize graph database with Wikidata adapter
  const graphDB = createGraphDB({
    enabledAdapters: ['wikidata']
  });
  
  await graphDB.initialize();
  
  // Import data from Wikidata
  const results = await graphDB.importExternalKG('wikidata', 'your-query');
  
  // Initialize IPFS storage
  const ipfsManager = createGraphIPFSManager();
  await ipfsManager.initialize();
  
  // Store graph in IPFS
  const cid = await ipfsManager.snapshotToIPFS();
  console.log('Stored in IPFS with CID:', cid);
  
  // Load graph from IPFS
  await ipfsManager.loadFromIPFS(cid);
}

main().catch(console.error);
```

## Knowledge Graph Adapters

The library supports the following knowledge graph sources:

- Wikidata
- DBpedia
- OpenAlex

### Using Adapters

```typescript
import { WikidataAdapter, DBpediaAdapter, OpenAlexAdapter } from 'groundline-mcp';

// Initialize with specific adapters
const graphDB = createGraphDB({
  enabledAdapters: ['wikidata', 'dbpedia', 'openalex']
});
```

## IPFS Integration

Store and retrieve your graphs using IPFS:

```typescript
import { createGraphIPFSManager, type IPFSConfig } from 'groundline-mcp';

// Initialize IPFS manager with custom config
const ipfsManager = createGraphIPFSManager({
  // IPFS configuration options
});

await ipfsManager.initialize();

// Store graph
const cid = await ipfsManager.snapshotToIPFS();

// Load graph
await ipfsManager.loadFromIPFS(cid);

// Get current graph state
const state = ipfsManager.getGraphState();
```

## Types

The library exports TypeScript types for better development experience:

```typescript
import type { Entity, Relation, IPFSConfig, GraphSnapshot } from 'groundline-mcp';

// Entity example
const entity: Entity = {
  name: "Example",
  entityType: "Person",
  observations: ["Note 1", "Note 2"],
  properties: {
    age: 30
  }
};

// Relation example
const relation: Relation = {
  from: "entity1-id",
  to: "entity2-id",
  relationType: "knows",
  properties: {
    since: "2024"
  }
};
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
