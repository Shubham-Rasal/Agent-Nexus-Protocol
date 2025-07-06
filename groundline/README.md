# Groundline GraphDB

A powerful decentralized graph database with IPFS persistence, CRDT-based collaboration, and seamless integration with multiple knowledge graph sources.

## Features

- 🔄 **CRDT-Based Collaboration** - Built on Yjs for real-time collaborative graph editing
- 📦 **IPFS Integration** - Decentralized storage with Helia and optional Filecoin pinning
- 🌐 **Knowledge Graph Integration** - Native support for:
  - Wikidata
  - DBpedia
  - OpenAlex
- 🔗 **JSON-LD Support** - Semantic web compatibility with JSON-LD context
- 📊 **Rich Graph Operations** - Comprehensive API for graph manipulation and querying
- 📝 **Provenance Tracking** - Track changes and maintain version history

## Installation

```bash
npm install @shubhamrasal/groundline
```

## Quick Start

```typescript
import { createGraphDB, createGraphIPFSManager } from '@shubhamrasal/groundline';

async function main() {
  // Initialize graph database with multiple adapters
  const graphDB = createGraphDB({
    enabledAdapters: ['wikidata', 'dbpedia', 'openalex']
  });
  
  await graphDB.initialize();
  
  // Import data from external knowledge graphs
  const wikidataResults = await graphDB.importExternalKG('wikidata', {
    query: 'your-sparql-query'
  });
  
  // Initialize IPFS storage with custom config
  const ipfsManager = createGraphIPFSManager({
    // Optional IPFS configuration
    pinningService: 'filecoin',  // Enable Filecoin pinning
    ipnsKey: 'your-ipns-key'     // For mutable pointers
  });
  
  await ipfsManager.initialize();
  
  // Store graph snapshot in IPFS
  const snapshot = await ipfsManager.snapshotToIPFS();
  console.log('Graph stored in IPFS with CID:', snapshot.cid);
  
  // Load graph from IPFS
  await ipfsManager.loadFromIPFS(snapshot.cid);
  
  // Get current graph state
  const state = ipfsManager.getGraphState();
}

main().catch(console.error);
```

## Knowledge Graph Integration

The library provides adapters for major knowledge graph sources:

```typescript
import { 
  WikidataAdapter, 
  DBpediaAdapter, 
  OpenAlexAdapter,
  type KGAdapter 
} from '@shubhamrasal/groundline';

// Initialize with specific adapters
const graphDB = createGraphDB({
  enabledAdapters: ['wikidata', 'dbpedia', 'openalex'],
  adapterConfig: {
    wikidata: {
      endpoint: 'https://query.wikidata.org/sparql'
    },
    dbpedia: {
      endpoint: 'https://dbpedia.org/sparql'
    }
  }
});

// Custom adapter implementation
class CustomAdapter implements KGAdapter {
  // Implement adapter interface
}
```

## Graph Data Model

The library uses a property graph model with support for rich entity and relation types:

```typescript
import type { Entity, Relation } from '@shubhamrasal/groundline';

// Entity example
const entity: Entity = {
  name: "Tim Berners-Lee",
  entityType: "Person",
  observations: [
    "Inventor of the World Wide Web",
    "Director of W3C"
  ],
  properties: {
    birthDate: "1955-06-08",
    nationality: "British"
  }
};

// Relation example
const relation: Relation = {
  from: "tim-berners-lee",
  to: "world-wide-web",
  relationType: "invented",
  properties: {
    year: 1989,
    location: "CERN"
  }
};
```

## IPFS Integration

Store and retrieve graphs using IPFS with optional Filecoin pinning:

```typescript
import { createGraphIPFSManager, type IPFSConfig, type GraphSnapshot } from '@shubhamrasal/groundline';

// Initialize IPFS manager
const ipfsManager = createGraphIPFSManager({
  pinningService: 'filecoin',
  ipnsKey: 'your-ipns-key'
});

await ipfsManager.initialize();

// Create and store snapshot
const snapshot: GraphSnapshot = await ipfsManager.snapshotToIPFS();

// Load specific version
await ipfsManager.loadFromIPFS(snapshot.cid);

// Get latest version via IPNS
const latest = await ipfsManager.resolveLatest();
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
5. Format code:
   ```bash
   npm run format
   ```
6. Run linter:
   ```bash
   npm run lint
   ```

## Requirements

- Node.js >= 18.0.0
- NPM or compatible package manager

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC

## Author

Shubham Rasal ([@Shubham-Rasal](https://github.com/Shubham-Rasal))
