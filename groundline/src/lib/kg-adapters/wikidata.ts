import {
  BaseKGAdapter,
  ExternalEntity,
  ExternalRelation,
  QueryOptions,
} from "./adapter.js";

export class WikidataAdapter extends BaseKGAdapter {
  private endpoint = "https://query.wikidata.org/sparql";
  private headers = {
    "User-Agent":
      "MCP-Knowledge-Graph/1.0 (https://github.com/modelcontextprotocol/mcp-client-chatbot)",
    Accept: "application/sparql-results+json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  constructor() {
    super(
      "Wikidata",
      "Integration with Wikidata knowledge graph using SPARQL and EntityData API",
    );
  }

  async searchEntities(
    query: string,
    options: QueryOptions = {},
  ): Promise<ExternalEntity[]> {
    const sparqlQuery = `
      SELECT ?item ?itemLabel ?itemDescription ?itemType ?itemTypeLabel WHERE {
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:api "EntitySearch" .
          bd:serviceParam wikibase:endpoint "www.wikidata.org" .
          bd:serviceParam mwapi:search "${query}" .
          bd:serviceParam mwapi:language "${options.language || "en"}" .
          ?item wikibase:apiOutputItem mwapi:item .
        }
        ?item wdt:P31 ?itemType .
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "${options.language || "en"}" .
          ?item rdfs:label ?itemLabel .
          ?item schema:description ?itemDescription .
          ?itemType rdfs:label ?itemTypeLabel .
        }
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
        `Wikidata query failed: ${response.statusText} (${response.status})`,
      );
    }

    const data = (await response.json()) as {
      results: { bindings: any[] }
    };
    return data.results.bindings.map((binding: any) => ({
      id: binding.item.value.split("/").pop(),
      name: binding.itemLabel.value,
      type: binding.itemTypeLabel.value,
      description: binding.itemDescription?.value,
      source: "Wikidata",
      properties: {
        wikidataId: binding.item.value,
        wikidataType: binding.itemType.value,
      },
    }));
  }

  async getEntityRelations(
    entityId: string,
    options: QueryOptions = {},
  ): Promise<ExternalRelation[]> {
    const sparqlQuery = `
      SELECT ?property ?propertyLabel ?value ?valueLabel WHERE {
        wd:${entityId} ?property ?value .
        ?property rdf:type wikibase:Property .
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "${options.language || "en"}" .
          ?property rdfs:label ?propertyLabel .
          ?value rdfs:label ?valueLabel .
        }
      }
      LIMIT ${options.limit || 100}
      OFFSET ${options.offset || 0}
    `;

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      throw new Error(
        `Wikidata query failed: ${response.statusText} (${response.status})`,
      );
    }

    const data = (await response.json()) as {
      results: { bindings: any[] }
    };
    return data.results.bindings.map((binding: any) => ({
      from: entityId,
      to: binding.value.value.split("/").pop(),
      type: binding.propertyLabel.value,
      source: "Wikidata",
      properties: {
        wikidataProperty: binding.property.value,
      },
    }));
  }
}
