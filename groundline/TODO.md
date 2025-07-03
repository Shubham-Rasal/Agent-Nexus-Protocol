# ✅ TODO List — MCP-Compatible Knowledge Graph Server

---

## 🧠 Core Graph Engine (Local Storage)

- [x] Setup project scaffold (monorepo or modular structure)
- [x] Implement internal graph model (`Entity`, `Relation`)
- [x] Implement utility functions: add/edit/delete nodes/edges
- [ ] Integrate CRDT engine (Yjs)
  - [x] Setup Y.Doc with `nodes` and `edges` maps
  - [ ] Implement utility functions: add/edit/delete nodes/edges
- [x] Add local persistence (Yjs + file-based JSON)
- [x] Implement change logging for provenance metadata

---

## 🧰 MCP Tool

- [x] Set up REST 
- [x] Define standard API endpoints:
  - [x] `POST /create_entities`
  - [x] `POST /create_relations`
  - [x] `POST /add_observations`
  - [x] `DELETE /delete_entities`
  - [x] `DELETE /delete_relations`
  - [x] `GET /read_graph`
  - [x] `GET /open_nodes`
  - [ ] `POST /snapshot_graph`
  - [ ] `GET /get_provenance`
  - [ ] `POST /pin_snapshot`
  - [ ] `POST /import_external_kg`
  - [ ] `GET /resolve_latest`

---

## 📤 IPFS + IPNS Integration

- [ ] Setup Helia client for IPFS interaction
- [ ] Implement graph snapshotting:
  - [ ] Serialize Y.Doc → JSON-LD or DAG-JSON
  - [ ] Upload to IPFS
  - [ ] Return CID
- [ ] Implement IPNS key management and pointer updates
- [ ] Integrate Filecoin (Web3.storage or Lighthouse) for permanent pinning
- [ ] Create version history log:
  - [ ] Track previous CID, current CID, and change logs
  - [ ] Store in local graph metadata

---

## 🔍 Provenance Tracker

- [ ] Design provenance metadata schema
- [ ] Hook into each MCP action to:
  - [ ] Capture timestamp, agent ID, CID diff
  - [ ] Append to changelog per graph
- [ ] Create endpoint: `GET /get_provenance`
- [ ] Optional: Ethereum anchor support (hash log with third-party service)

---

## 🌐 External Knowledge Graph Integration

- [ ] Create plugin interface for KG adapters
- [ ] Implement `wikidata-adapter`:
  - [ ] Accept label or SPARQL query
  - [ ] Parse results → `Entity`/`Relation`
- [ ] Implement `dbpedia-adapter`
- [ ] Implement `openalex-adapter`
- [ ] Implement `conceptnet-adapter`
- [ ] Add `import_external_kg` endpoint to orchestrate adapters

---

## 🖼 Frontend (Graph Editor)

- [ ] Set up React + Tailwind project
- [ ] Integrate graph visualizer (Cytoscape.js or Vis.js)
- [ ] Implement:
  - [ ] Add/edit/delete node UI
  - [ ] Edge creation UI
  - [ ] Import file (.json, .csv, .ttl)
  - [ ] Show CRDT-synced version in real-time
  - [ ] Publish graph → IPFS (via API)
  - [ ] View provenance history
- [ ] Fork/import graph by CID and load into editor

---

## 📚 Public Graph Registry

- [ ] Set up Postgres or SQLite for metadata
- [ ] Store published graphs: `title`, `author`, `CID`, `tags`, `createdAt`
- [ ] Implement endpoints:
  - [ ] `GET /public-graphs`
  - [ ] `POST /import/:cid`
- [ ] Add frontend UI for:
  - [ ] Search & filter graphs
  - [ ] Import/fork public graphs

---

## 🧪 Testing & Deployment

- [ ] Write unit tests for each MCP tool
- [ ] Write integration tests:
  - [ ] Full flow: create → snapshot → publish → import
  - [ ] External KG import → local storage
- [ ] Setup Docker/CI for backend
- [ ] Deploy IPFS node (Helia or remote gateway)
- [ ] Setup staging and production environments

