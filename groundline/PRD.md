Thanks, Shubham. Here's the **updated and merged PRD** that combines your original requirements with **MCP compatibility**, **provenance tracking**, and **external KG integration**:

---

# 🧠 MCP-Compatible GraphDB Package with IPFS Persistence — Product Requirements Document (PRD)

---

## 🔍 Overview

**Goal**:
Build a **reusable package (library/module)** that implements a **graph database** with:

* **Decentralized storage** (via IPFS/IPNS)
* **Provenance tracking** (CID chains, logs, optional blockchain anchoring)
* **External KG integration** (Wikidata, DBpedia, OpenAlex, etc.)
* **Programmatic API** for graph operations (create, edit, import, publish, provenance, etc.)

This package can be used as the backend for a **REST API server**, an **MCP server**, or embedded in other applications. It is not a monolithic server, but a core engine that can be wrapped with different interfaces.

---

## 1. 🎯 Core Features

### ✅ Graph Lifecycle

| Phase      | Feature                                                              |
| ---------- | -------------------------------------------------------------------- |
| Drafting   | Create/edit graphs locally via CRDT (Yjs)                            |
| Import     | Import from JSON, CSV, RDF, GraphML or external KGs (Wikidata, etc.) |
| Publishing | Serialize + publish to IPFS, update IPNS, store provenance           |
| Discovery  | Browse/import published graphs via CID or search                     |
| MCP Access | Expose programmatic API for MCP/REST to read/write/query/export      |

---

## 2. 🛠️ Package Architecture

| Layer                 | Tech/Approach                                      |
| --------------------- | -------------------------------------------------- |
| Local Graph Store     | CRDT (Yjs), property graph format                  |
| IPFS Publishing Layer | Helia + Filecoin for permanent pinning             |
| Provenance Tracker    | CID chain, changelogs, optional Ethereum anchor    |
| External KG Adapter   | SPARQL + REST wrappers for Wikidata, DBpedia, etc. |
| Programmatic API      | Expose all graph operations as JS/TS API           |

---

## 3. 🧩 Package API & Graph Operations

The package exposes a programmatic API (JS/TS) for all graph operations. This API can be used to build REST endpoints, MCP tools, or other interfaces.

| Method/Action         | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `createEntities`      | Create one or more nodes/entities                      |
| `createRelations`     | Link nodes with directional edges                      |
| `addObservations`     | Attach descriptions or attributes to entities          |
| `deleteEntities`      | Remove entity and attached relations                   |
| `snapshotGraph`       | Serialize graph → upload to IPFS → return CID          |
| `pinSnapshot`         | Store CID on Filecoin (via Web3.storage or Lighthouse) |
| `resolveLatest`       | Resolve latest version from IPNS pointer               |
| `importExternalKG`    | Import entities/edges from Wikidata, DBpedia, OpenAlex |
| `getProvenance`       | Return change history, CID lineage, and logs           |
| `loadGraphByCID`      | Load a published graph from IPFS by CID                |

---

## 4. 🧑‍💻 Usage Scenarios

### As a Backend for REST or MCP Server

- Import the package in a Node.js server
- Use the programmatic API to implement REST endpoints or MCP tool handlers
- All persistence, provenance, and KG integration handled by the package

### As a Standalone Library

- Use in scripts, CLIs, or other apps to manage graphs with IPFS persistence
- Directly call API methods for graph CRUD, import/export, provenance, etc.

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
| MCP/REST     | Auth via API key/JWT      |

---

## 9. 📦 Deliverables

| Component            | Description                                 |
| -------------------- | ------------------------------------------- |
| GraphDB Package      | Core library for graph + IPFS + provenance  |
| Programmatic API     | JS/TS API for all graph operations          |
| External KG Adapters | Modular wrapper for each data source        |
| Provenance Tracker   | CID lineage + changelog tracking            |
| Example REST Server  | (Optional) Example REST API using package   |
| Example MCP Server   | (Optional) Example MCP server using package |

---

## 10. 📆 Timeline (8 Weeks)

| Week | Deliverable                               |
| ---- | ----------------------------------------- |
| 1    | GraphDB package MVP (CRDT, API, IPFS)     |
| 2    | File import: JSON/CSV/RDF/GraphML         |
| 3    | External KG adapter (Wikidata)            |
| 4    | Provenance chain + CID history            |
| 5    | Example REST/MCP server                   |
| 6    | Public registry & import by CID           |
| 7    | Final polish + test coverage              |
| 8    | Documentation & release                   |

---
