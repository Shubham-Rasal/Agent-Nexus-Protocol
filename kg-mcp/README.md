# kg-mcp

A Model Context Protocol (MCP) server that provides AI agents with powerful knowledge graph capabilities using the [Groundline GraphDB](https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline) library.

## Overview

kg-mcp bridges the gap between AI agents and decentralized knowledge graphs by providing a standardized MCP interface to interact with distributed graph databases. It leverages Groundline's powerful features including IPFS persistence, CRDT-based collaboration, and seamless integration with major knowledge graph sources like Wikidata, DBpedia, and OpenAlex.

## Features

- 🌐 **External Knowledge Graph Integration** - Search and import from Wikidata, DBpedia, and OpenAlex
- 📦 **IPFS Persistence** - Store and retrieve knowledge graphs on decentralized IPFS network
- 🔄 **CRDT-Based Collaboration** - Real-time collaborative graph editing with conflict resolution
- 🔗 **JSON-LD Support** - Semantic web compatibility with standardized data formats
- 📊 **Rich Graph Operations** - Create entities, relations, and manage complex graph structures
- 📝 **Provenance Tracking** - Track changes and maintain complete version history
- 🤖 **AI Agent Ready** - Native MCP integration for seamless AI agent interaction

## Installation

```bash
npm install kg-mcp
```

## Quick Start

### 1. Environment Setup

Create a `.env` file in your project root:

```env
FIL_PRIVATE_KEY=your_filecoin_private_key_here
```

### 2. Basic Usage

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// The kg-mcp server provides these tools:
// - create_entity: Create new entities in the knowledge graph
// - create_relation: Create relationships between entities
// - search_external_kg: Search external knowledge graphs
// - import_external_entity: Import entities from external sources
// - export_graph: Export graph as JSON-LD
// - get_provenance: Get change history and provenance information
```

### 3. Running the Server

```bash
# Build the project
npm run build

# Run the MCP server
node dist/index.js
```

## Available Tools

### 1. Create Entity

Create a new entity in the knowledge graph.

```typescript
{
  "entity": {
    "name": "Albert Einstein",
    "entityType": "Person",
    "properties": {
      "birthYear": 1879,
      "profession": "Physicist"
    },
    "observations": ["Developed theory of relativity"]
  }
}
```

### 2. Create Relation

Establish relationships between entities.

```typescript
{
  "relation": {
    "from": "entity_id_1",
    "to": "entity_id_2", 
    "relationType": "COLLABORATED_WITH",
    "properties": {
      "year": 1925,
      "project": "Quantum Mechanics"
    }
  }
}
```

### 3. Search External Knowledge Graph

Search for entities in external knowledge graphs (Wikidata, DBpedia, OpenAlex).

```typescript
{
  "source": "wikidata",
  "query": "Einstein",
  "options": {
    "limit": 10,
    "language": "en"
  }
}
```

### 4. Import External Entity

Import an entity and its relations from external knowledge graphs.

```typescript
{
  "source": "wikidata",
  "entityId": "Q937",
  "options": {
    "importRelations": true,
    "maxRelations": 20,
    "language": "en"
  }
}
```

### 5. Export Graph

Export the knowledge graph as JSON-LD format, optionally publishing to IPFS.

```typescript
{
  "options": {
    "validate": true,
    "publishToIPFS": true
  }
}
```

### 6. Get Provenance

Retrieve provenance information and change history for the knowledge graph.

```typescript
{}
```

## Supported Knowledge Graph Sources

### Wikidata
- **Description**: Collaborative knowledge base with structured data
- **Use Cases**: Academic research, general knowledge, historical data
- **Query Types**: Entity search, SPARQL queries

### DBpedia
- **Description**: Extracted structured content from Wikipedia
- **Use Cases**: Semantic web applications, linked data projects
- **Query Types**: Entity search, relation discovery

### OpenAlex
- **Description**: Open catalog of scholarly works and authors
- **Use Cases**: Academic research, publication analysis, citation networks
- **Query Types**: Author search, publication search, citation analysis

## Graph Data Model

The kg-mcp server uses a property graph model compatible with semantic web standards:

### Entity Structure
```typescript
interface Entity {
  id?: string;                    // Auto-generated if not provided
  name: string;                   // Required: Entity name
  entityType: string;             // Required: Type of entity
  properties?: Record<string, any>; // Optional: Additional properties
  observations?: string[];        // Optional: Text observations
}
```

### Relation Structure
```typescript
interface Relation {
  from: string;                   // Source entity ID
  to: string;                     // Target entity ID
  relationType: string;           // Type of relationship
  properties?: Record<string, any>; // Optional: Relation properties
}
```

## IPFS Integration

The kg-mcp server leverages Groundline's IPFS integration for:

- **Decentralized Storage**: Store knowledge graphs on IPFS network
- **Content Addressing**: Immutable, content-addressed storage
- **Global Access**: Access graphs from anywhere in the network
- **Version Control**: Track changes with IPFS CIDs

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5.0+
- Filecoin private key for IPFS operations

### Build Commands
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean

# Run tests
npm test
```

### Project Structure
```
kg-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Configuration

The server can be configured through environment variables:

```env
# Required: Filecoin private key for IPFS operations
FIL_PRIVATE_KEY=your_private_key_here

# Optional: Custom IPFS RPC endpoint
IPFS_RPC_URL=https://api.calibration.node.glif.io/rpc/v1

# Optional: Enable CDN for faster access
IPFS_WITH_CDN=true
```

## Use Cases

### AI Research & Development
- Ground AI models with structured knowledge
- Build knowledge-aware conversational agents
- Create semantic search systems

### Academic Research
- Import and analyze scholarly data from OpenAlex
- Build citation networks and research graphs
- Track research provenance and collaboration

### Enterprise Knowledge Management
- Create internal knowledge graphs
- Integrate with existing data sources
- Enable semantic search across documents

### Semantic Web Applications
- Build linked data applications
- Create interoperable knowledge bases
- Develop ontology-driven systems

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines
1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation as needed
4. Ensure MCP compatibility

## License

ISC License - see LICENSE file for details.

## Related Projects

- [Groundline GraphDB](https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline) - The underlying graph database library
- [Model Context Protocol](https://modelcontextprotocol.io/) - Standard for AI agent tool integration
- [Synapse SDK](https://github.com/filoz-network/synapse-sdk) - IPFS and Filecoin integration

## Support

For questions, issues, or contributions:
- GitHub Issues: [Agent-Nexus-Protocol Issues](https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/issues)
- Documentation: [Groundline Documentation](https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline)

---

Built with ❤️ using [Groundline GraphDB](https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline) and the [Model Context Protocol](https://modelcontextprotocol.io/).
