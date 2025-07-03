# ✅ TODO List — MCP-Compatible GraphDB Package (IPFS Persistence)

---

## 🧠 Core GraphDB Package (Library/Module)

- [x] Setup project scaffold (monorepo or modular structure)
- [x] Implement internal graph model (`Entity`, `Relation`)
- [x] Implement utility functions: add/edit/delete nodes/edges
- [x] Integrate CRDT engine (Yjs)
  - [x] Setup Y.Doc with `nodes` and `edges` maps
  - [x] Implement utility functions: add/edit/delete nodes/edges (CRDT-aware)
- [x] Add local persistence (Yjs + file-based JSON)
- [x] Implement change logging for provenance metadata
- [x] Expose programmatic API (JS/TS) for all graph operations:
  - [x] `createEntities`, `createRelations`, `addObservations`, `deleteEntities`, etc.
  - [x] `snapshotGraph`, `pinSnapshot`, `resolveLatest`, `getProvenance`, `importExternalKG`, `loadGraphByCID`
- [ ] Package documentation (usage, API reference)

---

## 📤 IPFS + IPNS Integration (as Library Features)

- [x] Setup Synapse SDK for IPFS interaction
- [x] Implement graph snapshotting:
  - [x] Serialize Y.Doc → JSON
  - [x] Upload to IPFS via Synapse
  - [x] Return CommP (CID)
- [ ] Implement IPNS key management and pointer updates
- [x] Integrate Filecoin storage via Synapse SDK
- [x] Create version history log:
  - [x] Track previous CID, current CID, and change logs
  - [x] Store in local graph metadata

---

## 🔍 Provenance Tracker (as Library Feature)

- [ ] Design provenance metadata schema
- [ ] Hook into each API action to:
  - [ ] Capture timestamp, agent ID, CID diff
  - [ ] Append to changelog per graph
- [ ] Expose provenance via programmatic API
- [ ] Optional: Ethereum anchor support (hash log with third-party service)

---

## 🌐 External Knowledge Graph Integration (Adapters)

- [ ] Create plugin interface for KG adapters
- [ ] Implement `wikidata-adapter`:
  - [ ] Accept label or SPARQL query
  - [ ] Parse results → `Entity`/`Relation`
- [ ] Implement `dbpedia-adapter`
- [ ] Implement `openalex-adapter`
- [ ] Implement `conceptnet-adapter`
- [ ] Expose `importExternalKG` method in package API

---

## 🧩 Example Usage: REST/MCP Server (Optional)

- [ ] Create example REST API server using the package
  - [ ] Implement REST endpoints by calling package API
- [ ] Create example MCP server/tool using the package
  - [ ] Implement MCP tool handlers by calling package API
- [ ] Example scripts/CLI for direct usage

---

## 📚 Public Graph Registry (Optional, Example)

- [ ] Set up Postgres or SQLite for metadata (if needed)
- [ ] Store published graphs: `title`, `author`, `CID`, `tags`, `createdAt`
- [ ] Implement example endpoints:
  - [ ] `GET /public-graphs`
  - [ ] `POST /import/:cid`
- [ ] Example frontend UI for:
  - [ ] Search & filter graphs
  - [ ] Import/fork public graphs

---

## 🧪 Testing & Deployment

- [ ] Write unit tests for each package API method
- [ ] Write integration tests:
  - [ ] Full flow: create → snapshot → publish → import
  - [ ] External KG import → local storage
- [ ] Setup Docker/CI for package and example servers
- [ ] Deploy IPFS node (Helia or remote gateway)
- [ ] Setup staging and production environments

---

## 📖 Documentation & Release

- [ ] Write package documentation (README, API docs, usage examples)
- [ ] Document example REST/MCP server usage
- [ ] Prepare for npm (or other) release

