import {
  BaseKGAdapter,
  ExternalEntity,
  ExternalRelation,
  QueryOptions,
} from "./adapter.js";

export class DBpediaAdapter extends BaseKGAdapter {
  private endpoint = "https://dbpedia.org/sparql";
  private headers = {
    "User-Agent":
      "MCP-Knowledge-Graph/1.0 (https://github.com/modelcontextprotocol/mcp-client-chatbot)",
    Accept: "application/sparql-results+json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  constructor() {
    super(
      "DBpedia",
      "Integration with DBpedia knowledge graph using SPARQL endpoint",
    );
  }

  async searchEntities(
    query: string,
    options: QueryOptions = {},
  ): Promise<ExternalEntity[]> {
    // DBpedia uses language-specific datasets, handle in the query
    const lang = options.language || "en";
    const langFilter = lang === "en" ? "" : `FILTER(LANG(?label) = "${lang}")`;

    const sparqlQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbr: <http://dbpedia.org/resource/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

      SELECT DISTINCT ?entity ?label ?abstract ?type ?typeLabel WHERE {
        ?entity rdfs:label ?label .
        ?entity dbo:abstract ?abstract .
        ?entity rdf:type ?type .
        ?type rdfs:label ?typeLabel .
        
        FILTER(CONTAINS(LCASE(?label), LCASE("${query}")) || 
               CONTAINS(LCASE(?abstract), LCASE("${query}")))
        ${langFilter}
        FILTER(LANG(?abstract) = "${lang}")
        FILTER(STRSTARTS(STR(?type), "http://dbpedia.org/ontology/"))
        FILTER(LANG(?typeLabel) = "en")
      }
      LIMIT ${options.limit || 10}
      OFFSET ${options.offset || 0}
    `;

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      throw new Error(
        `DBpedia query failed: ${response.statusText} (${response.status})`,
      );
    }

    const data = (await response.json()) as {
      results: { bindings: any[] }
    };
    return data.results.bindings.map((binding: any) => ({
      id: binding.entity.value.split("/").pop(),
      name: binding.label.value,
      type: binding.typeLabel.value,
      description: binding.abstract.value,
      source: "DBpedia",
      properties: {
        dbpediaUri: binding.entity.value,
        dbpediaType: binding.type.value,
      },
    }));
  }

  async getEntityRelations(
    entityId: string,
    options: QueryOptions = {},
  ): Promise<ExternalRelation[]> {
    const lang = options.language || "en";
    const langFilter =
      lang === "en" ? "" : `FILTER(LANG(?targetLabel) = "${lang}")`;

    const sparqlQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbr: <http://dbpedia.org/resource/>

      SELECT DISTINCT ?predicate ?predicateLabel ?target ?targetLabel WHERE {
        dbr:${entityId} ?predicate ?target .
        ?predicate rdfs:label ?predicateLabel .
        OPTIONAL { ?target rdfs:label ?targetLabel }
        
        FILTER(STRSTARTS(STR(?predicate), "http://dbpedia.org/ontology/"))
        FILTER(LANG(?predicateLabel) = "en")
        ${langFilter}
        FILTER(!isLiteral(?target) || LANG(?target) = "${lang}")
      }
      LIMIT ${options.limit || 5}
      OFFSET ${options.offset || 0}
    `;

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      throw new Error(
        `DBpedia query failed: ${response.statusText} (${response.status})`,
      );
    }

    const data = (await response.json()) as {
      results: { bindings: any[] }
    };
    return data.results.bindings
      .filter((binding: any) => binding.target.type === "uri") // Only include URI relations
      .map((binding: any) => ({
        from: entityId,
        to: binding.target.value.split("/").pop(),
        type: binding.predicateLabel.value,
        source: "DBpedia",
        properties: {
          dbpediaPredicate: binding.predicate.value,
          targetLabel: binding.targetLabel?.value,
        },
      }));
  }
}
