# PRD: Groundline GraphDB on Filecoin Onchain Cloud

## 1. Goal

Build a decentralized knowledge graph database query engine (local + cloud) that removes the ETL bottleneck, enables cost-efficient graph storage, and provides granular pay-as-you-go pricing via Filecoin Onchain Cloud.

Knowledge Graphs have risen in popularity recently due to their value in grounding for AI. But managing and exploring knowledge graphs is still a great bottleneck requiring specialized solutions.

Most graph database query solutions don't run on data lakes or storage directly. This gap can be exploited for filecoin since it is made possible by the recent warmStorage solution. 

## 2. Problem Context

- Knowledge graphs are central to AI grounding (esp. RAG/Graph RAG).
- Existing graph databases (Neo4j, Neptune) are costly, siloed, and ETL-heavy.
- Current solutions don’t natively query from decentralized storage like Filcoin.

**Opportunity:** Filecoin WarmStorage + FilecoinPay enable a **cheaper, verifiable, pay-as-you-go alternative** with instant retrieval and streaming payments.

## 3. Target Customers

1. **Enterprise Graph DB Users** — companies already on Neo4j or Neptune looking to cut costs.

2. **Research Labs** — with large connected data sets needing flexible query infra.

3. **AI Teams (RAG/Graph RAG)** — LLM-powered products requiring knowledge graph grounding.
    

Note: Research Labs include researchers who are already using open knowledge graphs.


---

## 4. Solution Overview

### Local Version 

- Distributed as **npm package + Docker container**.
- Developers can import schema + data and query without ETL.
- Integrates with Filecoin via Synapse SDK for storage/retrieval.
    

### Cloud Version (v1.2)

- Managed graph database hosted on **Filecoin Onchain Cloud**.
    
- Warm storage ensures instant retrieval, FilecoinPay enables hybrid billing.
    
- Supports AI integrations (Graph RAG tooling, LLM connectors).
    
<img width="1335" height="669" alt="image" src="https://github.com/user-attachments/assets/d85da956-7536-4549-a829-a396e96f6c81" />

---

## 5. Value Proposition

- **Cheaper  Storage** → Store graphs on Filecoin WarmStorage at a fraction of traditional DB cost.

- **No ETL Overhead** → Query directly on Filecoin-hosted data.

- **Granular Pricing** → Hybrid model combining storage + query usage.

- **Verifiable Guarantees** → PDP ensures storage proofs, SLA enforced via FilecoinPay.

- **AI-Native** → Directly usable in Graph RAG pipelines for LLMs.

---

## 6. Technical Design

- **Architecture**
    
    - Off-chain query engine (Docker service).
        
    - Schema + data separation.
        
    - Provenance tracking (optional future).
        
    - FilecoinWarmStorageService handles storage & retrieval proofs.
        
    - FilecoinPay validates query and storage payments.
        
    - Synapse SDK provides integration hooks.
        

- **Data Model**
    
    - JSON-LD for semantic compatibility.
        
    - Vector embeddings stored alongside graph nodes/edges.
        
    - Import/export to IPFS/Filecoin.
        
- **Query**
    
    - GraphQL + Cypher-like API.
        
    - Vector search via embeddings.
        
    - AI connectors (planned): Graph RAG API.
        

---

## 7. Pricing Model (Hybrid)

- **Storage (WarmStorage)**
    
    - Base: ~2 USDFC/TiB/month (without CDN).
        
    - Optional CDN: 2.5 USDFC/TiB/month.
        
    - One-time dataset creation fee.
        
- **Query Usage (FilecoinPay)**
    
    - Tiered per-query pricing (per 1K queries).
        
    - Pricing based on query complexity (simple lookup vs vector search).
        
    - Granular pay-as-you-go via streaming rails.
        
---

## 8. Metrics

**Initial (first 2 weeks)**

- Amount of data stored (GB/TiB).
    
- Query latency benchmarks.
    
- npm package downloads.
    
- Volume of queries executed.
    
- Storage consumption growth (TiB).
    

---

## 9. Future Extensions

- Managed provenance/versioning for auditability in AI.
    
- Consumer-facing knowledge graph explorer.
    
- Native Graph RAG tooling (prebuilt pipelines for LLMs).
    
