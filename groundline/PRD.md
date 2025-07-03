Thanks, Shubham. Here's the **updated and merged PRD** that combines your original requirements with **MCP compatibility**, **provenance tracking**, and **external KG integration**:

---

# 🧠 MCP-Compatible Knowledge Graph Server — Product Requirements Document (PRD)

---

## 🔍 Overview

**Goal**:
Build a **graph database server** that enables users and AI agents to collaboratively create, edit, import, and publish graphs with:

* **Decentralized storage** (via IPFS/IPNS)
* **Provenance tracking** (CID chains, logs, optional blockchain anchoring)
* **External KG integration** (Wikidata, DBpedia, OpenAlex, etc.)
* **MCP-compatible API** for AI agent interoperability

---

## 1. 🎯 Core Features

### ✅ Graph Lifecycle

| Phase      | Feature                                                              |
| ---------- | -------------------------------------------------------------------- |
| Drafting   | Create/edit graphs locally via CRDT (Yjs)                            |
| Import     | Import from JSON, CSV, RDF, GraphML or external KGs (Wikidata, etc.) |
| Publishing | Serialize + publish to IPFS, update IPNS, store provenance           |
| Discovery  | Browse/import published graphs via CID or search                     |
| MCP Access | AI agents use MCP API to read/write/query/export graphs              |

---

## 2. 🧱 Architecture Overview

| Layer                 | Tech/Approach                                      |
| --------------------- | -------------------------------------------------- |
| Local Graph Store     | CRDT (Yjs), property graph format                  |
| IPFS Publishing Layer | Helia + Filecoin for permanent pinning             |
| Provenance Tracker    | CID chain, changelogs, optional Ethereum anchor    |
| External KG Adapter   | SPARQL + REST wrappers for Wikidata, DBpedia, etc. |
| MCP Interface Layer   | Standard MCP tools for entity/relation ops         |
| Public Registry       | PostgreSQL index of published graphs with metadata |

---

## 3. 🛠️ MCP Tooling & Graph Operations

| Tool/Action          | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `create_entities`    | Create one or more nodes/entities                      |
| `create_relations`   | Link nodes with directional edges                      |
| `add_observations`   | Attach descriptions or attributes to entities          |
| `delete_entities`    | Remove entity and attached relations                   |
| `snapshot_graph`     | Serialize graph → upload to IPFS → return CID          |
| `pin_snapshot`       | Store CID on Filecoin (via Web3.storage or Lighthouse) |
| `resolve_latest`     | Resolve latest version from IPNS pointer               |
| `import_external_kg` | Import entities/edges from Wikidata, DBpedia, OpenAlex |
| `get_provenance`     | Return change history, CID lineage, and logs           |

---

## 4. 🧑‍💻 User & Agent Workflows

### 🧍 For Human Users

1. **Create Graph**

   * Add nodes/edges via UI
   * Store in CRDT (Yjs) → IndexedDB
2. **Import Graph**

   * Upload `.csv`, `.json`, `.ttl`, `.graphml` OR
   * Query + import from Wikidata/DBpedia/OpenAlex
3. **Publish Graph**

   * Export as JSON-LD → IPFS → get CID
   * Write to public registry
   * Track provenance (CID lineage, timestamp, author)
4. **Import Public Graph**

   * Discover by tag/search
   * Clone by CID
   * Forked version → editable in draft mode

### 🤖 For AI Agents (via MCP)

* Call `create_entities`, `create_relations`, etc.
* Read and write from the same storage layer
* Fetch published graphs via `read_graph`, `resolve_latest`
* Snapshot changes → `snapshot_graph` → receive CID

---

## 5. 🧬 Provenance Design

### Data Stored per Graph Change

```json
{
  "timestamp": 1728548391,
  "updated_by": "agent://gpt-4o",
  "prev": "QmPrev...",
  "current": "QmCurrent...",
  "change_log": ["+ Added node Q42", "+ Linked to DBpedia"]
}
```

* Chain forms a **provenance DAG**
* Snapshots are **deterministically hashed**
* Optionally **anchor hashes on blockchain** (Ethereum via Light Clients or third-party services)

---

## 6. 🌐 External KG Integration

| Source     | Method              | Adapter              |
| ---------- | ------------------- | -------------------- |
| Wikidata   | SPARQL + EntityData | `wikidata-adapter`   |
| DBpedia    | SPARQL              | `dbpedia-adapter`    |
| OpenAlex   | REST                | `openalex-adapter`   |
| ConceptNet | REST                | `conceptnet-adapter` |

Each adapter:

* Accepts structured query (e.g., entity label)
* Fetches data
* Maps schema to `{ name, entityType, observations[] }`
* Returns structured JSON for import

---

## 7. 📁 Data Format

### Internal Graph Model

```ts
type Entity = {
  name: string;
  entityType: string;
  observations: string[];
};

type Relation = {
  from: string;
  to: string;
  relationType: string;
};
```

### Storage Format

* JSON-LD or DAG-JSON for snapshot serialization
* Stored on IPFS
* Indexed by CIDs and optionally by IPNS

---

## 8. 🔐 Security & Access Control

| Graph Type   | Access Type               |
| ------------ | ------------------------- |
| Draft        | Local CRDT only (private) |
| Published    | Read-only via IPFS        |
| Imported     | Forked → private draft    |
| MCP Endpoint | Auth via API key/JWT      |

---

## 9. 📦 Deliverables

| Component            | Description                                 |
| -------------------- | ------------------------------------------- |
| CRDT Graph Engine    | Yjs-backed local store for draft graphs     |
| MCP API Server       | REST/GraphQL MCP tool endpoint handler      |
| IPFS Integration     | Helia, Web3.storage for snapshotting        |
| External KG Adapters | Modular wrapper for each data source        |
| Provenance Tracker   | CID lineage + changelog tracking            |
| Frontend Editor      | React UI for graph editing, import, publish |
| Public Registry      | Index of published graphs (Postgres)        |

---

## 10. 📆 Timeline (8 Weeks)

| Week | Deliverable                               |
| ---- | ----------------------------------------- |
| 1    | CRDT graph editor MVP                     |
| 2    | File import: JSON/CSV/RDF/GraphML         |
| 3    | External KG adapter (Wikidata)            |
| 4    | MCP tool: `create_entities`, `read_graph` |
| 5    | Snapshot + publish to IPFS/IPNS           |
| 6    | Provenance chain + CID history            |
| 7    | Public registry & import by CID           |
| 8    | Final polish + test coverage              |

---
