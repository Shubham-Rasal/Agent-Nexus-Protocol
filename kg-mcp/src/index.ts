import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createGraphDB } from "@shubhamrasal/groundline";
import { WikidataAdapter } from "@shubhamrasal/groundline";
import { DBpediaAdapter } from "@shubhamrasal/groundline";
import { OpenAlexAdapter } from "@shubhamrasal/groundline";
import dotenv from "dotenv";

dotenv.config();

// Initialize GraphDB
const graphDB = createGraphDB({
  ipfs: {
    rpcURL: "https://api.calibration.node.glif.io/rpc/v1",
    privateKey: process.env.FIL_PRIVATE_KEY,
    withCDN: true
  }
});

// Initialize MCP server
const server = new McpServer({
  name: "groundline-mcp-server",
  version: "0.0.1",
});

// Initialize adapters
const adapters = {
  wikidata: new WikidataAdapter(),
  dbpedia: new DBpediaAdapter(),
  openalex: new OpenAlexAdapter(),
};

// Initialize GraphDB
await graphDB.initialize();

// Tool: Create Entity
server.tool(
  "create_entity",
  "Create a new entity in the knowledge graph",
  {
    entity: z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Entity name cannot be empty"),
      entityType: z.string().min(1, "Entity type cannot be empty"),
      properties: z.record(z.any()).optional(),
      observations: z.array(z.string()).optional(),
    }),
  },
  async ({ entity }) => {
    const result = await graphDB.createEntities([entity]);
    return {
      content: [
        {
          type: "text",
          text: `Created entity with ID: ${result[0]}`,
        },
      ],
    };
  }
);

// Tool: Create Relation
server.tool(
  "create_relation",
  "Create a relation between two entities",
  {
    relation: z.object({
      from: z.string().min(1, "Source entity ID cannot be empty"),
      to: z.string().min(1, "Target entity ID cannot be empty"),
      relationType: z.string().min(1, "Relation type cannot be empty"),
      properties: z.record(z.any()).optional(),
    }),
  },
  async ({ relation }) => {
    const result = await graphDB.createRelations([relation]);
    return {
      content: [
        {
          type: "text",
          text: `Created relation with ID: ${result[0]}`,
        },
      ],
    };
  }
);

// Tool: Search External Knowledge Graph
server.tool(
  "search_external_kg",
  "Search for entities in external knowledge graphs",
  {
    source: z.enum(["wikidata", "dbpedia", "openalex"]),
    query: z.string().min(1, "Search query cannot be empty"),
    options: z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      language: z.string().optional(),
    }).optional(),
  },
  async ({ source, query, options }) => {
    const adapter = adapters[source];
    const results = await adapter.searchEntities(query, options);
    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} entities in ${source}:\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: Import External Entity
server.tool(
  "import_external_entity",
  "Import an entity and its relations from an external knowledge graph",
  {
    source: z.enum(["wikidata", "dbpedia", "openalex"]),
    entityId: z.string().min(1, "Entity ID cannot be empty"),
    options: z.object({
      importRelations: z.boolean().optional(),
      maxRelations: z.number().optional(),
      language: z.string().optional(),
    }).optional(),
  },
  async ({ source, entityId, options }) => {
    const adapter = adapters[source];

    // Get entity details
    const [entity] = await adapter.searchEntities(`id:${entityId}`, { limit: 1 });
    if (!entity) {
      return {
        content: [
          {
            type: "text",
            text: `No entity found with ID ${entityId} in ${source}`,
          },
        ],
      };
    }

    // Import entity
    const internalEntity = adapter.transformEntity(entity);
    const [entityId_] = await graphDB.createEntities([internalEntity]);

    const relationIds: string[] = [];

    // Import relations if requested
    if (options?.importRelations) {
      const relations = await adapter.getEntityRelations(entityId, {
        limit: options.maxRelations || 10,
        language: options.language,
      });

      // Import each relation and its target entity
      for (const relation of relations) {
        const [targetEntity] = await adapter.searchEntities(`id:${relation.to}`, { limit: 1 });
        if (targetEntity) {
          const internalTargetEntity = adapter.transformEntity(targetEntity);
          const [targetId] = await graphDB.createEntities([internalTargetEntity]);

          const internalRelation = adapter.transformRelation({
            ...relation,
            from: entityId_,
            to: targetId,
          });

          const [relationId] = await graphDB.createRelations([internalRelation]);
          relationIds.push(relationId);
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Imported entity ${entityId_} from ${source} with ${relationIds.length} relations`,
        },
      ],
    };
  }
);

// Tool: Export Graph
server.tool(
  "export_graph",
  "Export the knowledge graph to JSON-LD and optionally publish to IPFS",
  {
    options: z.object({
      validate: z.boolean().optional(),
      publishToIPFS: z.boolean().optional(),
    }).optional(),
  },
  async ({ options }) => {
    const { jsonLd, ipfsCid } = await graphDB.exportAsJsonLD({
      validate: options?.validate ?? true,
      publishToIPFS: options?.publishToIPFS ?? false,
    });

    const response = {
      jsonLd,
      ...(ipfsCid && { ipfsCid }),
    };

    return {
      content: [
        {
          type: "text",
          text: `Exported graph:\n${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: Get Provenance
server.tool(
  "get_provenance",
  "Get provenance information for the knowledge graph",
  {},
  async () => {
    const provenance = graphDB.getProvenance();
    return {
      content: [
        {
          type: "text",
          text: `Provenance log:\n${JSON.stringify(provenance, null, 2)}`,
        },
      ],
    };
  }
);

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);

