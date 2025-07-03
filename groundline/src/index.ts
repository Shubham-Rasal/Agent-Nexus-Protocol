import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WikidataAdapter } from "./lib/kg-adapters/wikidata.js";
import { DBpediaAdapter } from "./lib/kg-adapters/dbpedia.js";
import { OpenAlexAdapter } from "./lib/kg-adapters/openalex.js";

const server = new McpServer({
  name: "custom-mcp-server",
  version: "0.0.1",
});

// Initialize adapters
const adapters = {
  wikidata: new WikidataAdapter(),
  dbpedia: new DBpediaAdapter(),
  openalex: new OpenAlexAdapter(),
};


const transport = new StdioServerTransport();

await server.connect(transport);
