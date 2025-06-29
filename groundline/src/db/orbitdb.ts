import { createLibp2p } from "libp2p";
import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { Libp2pOptions } from "./config.js";
import { GraphDB } from "./graph-db.js";

// Create an IPFS instance
const libp2p = await createLibp2p(Libp2pOptions);
const ipfs = await createHelia({ libp2p });

// Create OrbitDB instance
const orbitdb = await createOrbitDB({ ipfs });

// Create document stores for entities and relations
const entityStore = await orbitdb.open("entities", { type: "documents" });
const relationStore = await orbitdb.open("relations", { type: "documents" });

// Create GraphDB instance
export const graphDB = new GraphDB(entityStore, relationStore);
