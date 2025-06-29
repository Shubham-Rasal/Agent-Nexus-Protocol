import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { graphDB } from "./db/orbitdb.js";
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

server.tool(
  "get_entity",
  `Get an entity from the knowledge graph. Sample entity: {
"id" : "123"
  }`,
  {
    entity: z.object({
      id: z.string().min(1, "Entity id cannot be empty"),
    }),
  },
  async ({ entity }) => {
    const result = await graphDB.getEntityById(entity.id);
    return {
      content: [
        {
          type: "text",
          text: `Entity: ${JSON.stringify(result)}`,
        },
      ],
    };
  },
);

server.tool(
  "create_entity",
  `Create one or more entities in the knowledge graph. Sample entity: {
"name" : "Json",
"entityType" : "Person",
"observations": ["he is a guy"]
  }`,
  {
    entity: z.object({
      name: z.string().min(1, "Entity name cannot be empty"),
      entityType: z.string().min(1, "Entity type cannot be empty"),
      observations: z.array(z.string()).optional().default([]),
    }),
  },
  async ({ entity }) => {
    const result = await graphDB.addEntity(entity);

    return {
      content: [
        {
          type: "text",
          text: `Created ${result} entities with IDs: ${result}`,
        },
      ],
    };
  },
);

server.tool(
  "create_relation",
  `Create a relation between two entities in the knowledge graph. Sample relation: {
"from" : "123",
"to" : "456",
"relationType" : "knows"
  }`,
  {
    relation: z.object({
      from: z.string().min(1, "Source entity ID cannot be empty"),
      to: z.string().min(1, "Target entity ID cannot be empty"),
      relationType: z.string().min(1, "Relation type cannot be empty"),
    }),
  },
  async ({ relation }) => {
    const result = await graphDB.addRelation(relation);

    return {
      content: [
        {
          type: "text",
          text: `Created relation with ID: ${result}`,
        },
      ],
    };
  },
);

server.tool(
  "delete_relation",
  `Delete a relation from the knowledge graph by its ID. Sample relation: {
"id" : "123"
  }`,
  {
    relationId: z.string().min(1, "Relation ID cannot be empty"),
  },
  async ({ relationId }) => {
    const success = await graphDB.deleteRelation(relationId);

    return {
      content: [
        {
          type: "text",
          text: success
            ? `Successfully deleted relation ${relationId}`
            : `No relation found with ID ${relationId}`,
        },
      ],
    };
  },
);

server.tool(
  "search_nodes",
  `Search for entities in the knowledge graph by name or type. Sample query: {
"query" : "Json"
  }`,
  {
    query: z.string().min(1, "Search query cannot be empty"),
  },
  async ({ query }) => {
    const results = await graphDB.searchEntities(query);

    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} matching entities:\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  },
);

server.tool(
  "read_graph",
  `Traverse the graph starting from a given entity. Sample start entity: {
"startEntityId" : "123",
"maxDepth" : 2
  }`,
  {
    startEntityId: z.string().min(1, "Start entity ID cannot be empty"),
    maxDepth: z.number().min(1).max(5).optional().default(2),
  },
  async ({ startEntityId, maxDepth }) => {
    const graph = await graphDB.traverseGraph(startEntityId, maxDepth);
    const result = Object.fromEntries(graph);

    return {
      content: [
        {
          type: "text",
          text: `Graph traversal result:\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  },
);

server.tool(
  "search_external_kg",
  "Search for entities in external knowledge graphs",
  {
    source: z.enum(["wikidata", "dbpedia", "openalex"]),
    query: z.string().min(1, "Search query cannot be empty"),
    options: z
      .object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        language: z.string().optional(),
      })
      .optional(),
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
  },
);

server.tool(
  "import_external_entity",
  "Import an entity and its relations from an external knowledge graph",
  {
    source: z.enum(["wikidata", "dbpedia", "openalex"]),
    entityId: z.string().min(1, "Entity ID cannot be empty"),
    options: z
      .object({
        importRelations: z.boolean().optional(),
        maxRelations: z.number().optional(),
        language: z.string().optional(),
      })
      .optional(),
  },
  async ({ source, entityId, options }) => {
    const adapter = adapters[source];

    // First get the entity details
    const [entity] = await adapter.searchEntities(`id:${entityId}`, {
      limit: 1,
    });
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

    // Import the entity
    const internalEntity = adapter.transformEntity(entity);
    const entityId_ = await graphDB.addEntity(internalEntity);

    const relationIds: string[] = [];

    // Import relations if requested
    if (options?.importRelations) {
      const relations = await adapter.getEntityRelations(entityId, {
        limit: options.maxRelations || 10,
        language: options.language,
      });

      // Import each relation and its target entity
      for (const relation of relations) {
        const [targetEntity] = await adapter.searchEntities(
          `id:${relation.to}`,
          { limit: 1 },
        );
        if (targetEntity) {
          const internalTargetEntity = adapter.transformEntity(targetEntity);
          const targetId = await graphDB.addEntity(internalTargetEntity);

          const internalRelation = adapter.transformRelation({
            ...relation,
            from: entityId_,
            to: targetId,
          });

          const relationId = await graphDB.addRelation(internalRelation);
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
  },
);

server.tool(
  "get_relation",
  `Get a relation from the knowledge graph by its ID. Sample relation: {\n"id" : "123"\n  }`,
  {
    relationId: z.string().min(1, "Relation ID cannot be empty"),
  },
  async ({ relationId }) => {
    const result = await graphDB.getRelationById(relationId);
    return {
      content: [
        {
          type: "text",
          text: result
            ? `Relation: ${JSON.stringify(result)}`
            : `No relation found with ID ${relationId}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
