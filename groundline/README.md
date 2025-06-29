# Custom MCP Server (OrbitDB Knowledge Graph)

This is a custom MCP server implementation for the MCP Client Chatbot project. It uses OrbitDB as a decentralized backend for storing entities, relations, and knowledge graph data, and provides a rich set of MCP tools for graph management and external knowledge graph integration.

## Features

- Entity and relation management (create, delete, search, traverse)
- Graph traversal and search utilities
- Integration with external knowledge graphs (Wikidata, DBpedia, OpenAlex)
- Schema validation and transformation
- Extensible adapter framework for new KG sources

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)

### Setup

```bash
cd custom-mcp-server
pnpm install
pnpm dev # or pnpm build && pnpm start
```

The server will start and register all MCP tools for use by the client or any MCP-compatible agent.

## 🛠️ MCP Tools

Below is a list of available MCP tools, their descriptions, and usage examples.

### Entity Management

- **create_entities**

  - **Description:** Create one or more entities in the knowledge graph.
  - **Example:**
    ```json
    {
      "entities": [
        {
          "name": "Alan Turing",
          "entityType": "Person",
          "observations": ["Mathematician"]
        }
      ]
    }
    ```

- **get_entity**

  - **Description:** Get an entity from the knowledge graph by ID.
  - **Example:**
    ```json
    { "entity": { "id": "123" } }
    ```

- **delete_entity**

  - **Description:** Delete an entity from the knowledge graph by ID.
  - **Example:**
    ```json
    { "entityId": "123" }
    ```

- **add_observation**

  - **Description:** Add an observation to an entity.
  - **Example:**
    ```json
    { "entityId": "123", "observation": "New observation" }
    ```

- **delete_observation**
  - **Description:** Delete an observation from an entity.
  - **Example:**
    ```json
    { "entityId": "123", "observation": "Old observation" }
    ```

### Relation Management

- **create_relation**

  - **Description:** Create a relation between two entities.
  - **Example:**
    ```json
    { "relation": { "from": "123", "to": "456", "relationType": "colleague" } }
    ```

- **delete_relation**
  - **Description:** Delete a relation by its ID.
  - **Example:**
    ```json
    { "relationId": "789" }
    ```

### Graph Operations

- **search_nodes**

  - **Description:** Search for entities in the knowledge graph by name or type.
  - **Example:**
    ```json
    { "query": "Turing" }
    ```

- **read_graph**
  - **Description:** Traverse the graph starting from a given entity.
  - **Example:**
    ```json
    { "startEntityId": "123", "maxDepth": 2 }
    ```

### External Knowledge Graph Integration

- **search_external_kg**

  - **Description:** Search for entities in external knowledge graphs (Wikidata, DBpedia, OpenAlex).
  - **Example:**
    ```json
    {
      "source": "wikidata",
      "query": "Alan Turing",
      "options": { "limit": 5, "language": "en" }
    }
    ```
    ```json
    {
      "source": "dbpedia",
      "query": "Alan Turing",
      "options": { "limit": 5, "language": "en" }
    }
    ```
    ```json
    {
      "source": "openalex",
      "query": "Alan Turing",
      "options": { "limit": 5 }
    }
    ```

- **import_external_entity**
  - **Description:** Import an entity and its relations from an external knowledge graph.
  - **Example:**
    ```json
    {
      "source": "wikidata",
      "entityId": "Q7259",
      "options": {
        "importRelations": true,
        "maxRelations": 5,
        "language": "en"
      }
    }
    ```
    ```json
    {
      "source": "dbpedia",
      "entityId": "Alan_Turing",
      "options": {
        "importRelations": true,
        "maxRelations": 5,
        "language": "en"
      }
    }
    ```
    ```json
    {
      "source": "openalex",
      "entityId": "A2941294272",
      "options": { "importRelations": true, "maxRelations": 5 }
    }
    ```

## Extending the Server

- To add new external knowledge graph sources, implement a new adapter in `src/lib/kg-adapters/` following the `BaseKGAdapter` interface.
- Register the adapter in `src/index.ts` and add it to the `adapters` object.
- Update the `source` enum in the relevant tools to include your new source.

## License

MIT
