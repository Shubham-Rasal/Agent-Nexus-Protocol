Here's a **Product Requirements Document (PRD)** for your **MCP-compatible Knowledge Graph Server**, integrating:

- Storage layer built directly on top of IPFS
- IPFS/IPNS for decentralized pinning
- Provenance tracking
- External KG integration tools
- Standard MCP API for model compatibility

---

# 🧠 MCP Knowledge Graph Server — Product Requirements Document

---

## 🔍 Overview

**Goal**:  
Build an **MCP-compatible server** that powers trustworthy AI agents by providing access to a **transparent, extensible knowledge graph**, grounded in:

- **Real-time, editable graphs** (via storage layer built directly on top of IPFS)
- **Decentralized storage and provenance** (via IPFS/IPNS/Filecoin)
- **Composable integration with external KGs** (Wikidata, DBpedia, OpenAlex, etc.)
- **AI-native function API** (via MCP tools)

---

## 🧱 Architecture Summary

| Layer               | Tech/Approach                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Local Graph Store   | Storage layer built directly on top of IPFS                                              |
| Immutable Snapshots | [IPFS](https://ipfs.tech/), [IPNS](https://docs.ipfs.tech/concepts/ipns/) for versioning |
| Persistence Layer   | Filecoin (via Web3.storage, Lighthouse, Powergate, etc.)                                 |
| Interface Protocol  | [Model Context Protocol (MCP)] for AI function calling                                   |
| External Sources    | Wikidata, DBpedia, OpenAlex, ConceptNet, etc.                                            |
| Provenance Tracker  | Metadata logs, CID chains, optional anchoring on blockchain                              |

---

## 🛠 MCP Server Tools

| Tool Name             | Description                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `create_entities`     | Create new entities with `name`, `entityType`, and `observations[]`                                        |
| `create_relations`    | Define directed links between entities with `relationType`                                                 |
| `add_observations`    | Add observations to existing entities                                                                      |
| `delete_entities`     | Delete entity and its associated relations                                                                 |
| `delete_observations` | Remove selected observations from an entity                                                                |
| `delete_relations`    | Remove directed relation between two entities                                                              |
| `read_graph`          | Export full knowledge graph from storage layer built directly on top of IPFS                              |
| `search_nodes`        | Search across names, types, and observation content                                                        |
| `open_nodes`          | Return entities and their relations by name                                                                |
| `snapshot_graph`      | Dump full graph → IPFS → return CID                                                                        |
| `pin_snapshot`        | Pin specific CID to Filecoin or pinning service                                                            |
| `resolve_latest`      | Get latest IPFS snapshot from IPNS pointer                                                                 |
| `import_external_kg`  | Query external knowledge graphs (Wikidata, DBpedia, OpenAlex, etc.) and optionally import into local graph |
| `get_provenance`      | Return change logs, CID chains, and update history for any node or the full graph                          |

---

## 🔁 Graph Lifecycle Flow

### Case 1: Create/Update

1. AI model calls an MCP tool (e.g., `create_entities`)
2. MCP Server updates **storage layer built directly on top of IPFS**
3. Optionally triggers `snapshot_graph` tool:

   - Serializes graph → JSON-LD
   - Uploads to **IPFS**
   - Updates **IPNS pointer**
   - Stores provenance metadata:
     ```json
     {
       "timestamp": 1728548391,
       "updated_by": "agent://gpt-4o",
       "prev": "QmXYZ...",
       "current": "QmABC...",
       "change_log": ["Added Alice", "Linked to OpenAI"]
     }
     ```

### Case 2: Import External Graph

1. Call `import_external_kg` with `query`, `source`, and `import` flag
2. MCP Server:

   - Queries external API
   - Transforms response to local format
   - (Optional) saves into storage layer built directly on top of IPFS via `create_entities` + `create_relations`

---

## 🗃 Provenance Strategy

- Each update stored with:
  - `timestamp`
  - `agent_id`
  - `change_log`
  - `prev_cid` → `current_cid`
- Snapshots are **deterministically hashed**
- Optionally publish `current_cid` to **public blockchain** or **Ethereum log contract** (extendable)

---

## 🌍 External KG Integration Plan

### Initial Sources:

- **Wikidata** (via SPARQL + EntityData API)
- **DBpedia** (SPARQL endpoint)
- **OpenAlex** (REST)
- **ConceptNet** (REST)
- **CommonsenseKG / ATOMIC** (local dump)

### Architecture:

| Step          | Function                                |
| ------------- | --------------------------------------- |
| Query adapter | Uses API or SPARQL depending on source  |
| Transformer   | Maps external schema → local format     |
| Importer      | Optionally writes to storage layer built directly on top of IPFS |
| Extensibility | Each source gets its own plugin wrapper |

---

## 📁 Data Format (Internal)

```ts
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}
```

---

## 📦 Deliverables

| Component              | Status                            |
| ---------------------- | --------------------------------- |
| MCP server             | ✅ Implement tools and endpoints  |
| Graph schema           | ✅ Flexible node/key-value design |
| IPFS integration       | ✅ Snapshot → pin → return CID    |
| IPNS support           | ✅ Update mutable pointer         |
| Provenance tracker     | ✅ Metadata per CID               |
| External graph imports | ✅ Extendable per-source modules  |

---

## 🧪 Test Plan

- Unit tests per MCP tool
- End-to-end tests:
  - AI call → storage layer update → snapshot → IPFS
  - External KG → Import → Read
- Provenance validation via CID chain
- CID resolution through IPNS

---
