import {
  BaseKGAdapter,
  ExternalEntity,
  ExternalRelation,
  QueryOptions,
} from "./adapter.js";

export class OpenAlexAdapter extends BaseKGAdapter {
  private baseUrl = "https://api.openalex.org";
  private headers = {
    "User-Agent":
      "MCP-Knowledge-Graph/1.0 (https://github.com/modelcontextprotocol/mcp-client-chatbot)",
    Accept: "application/json",
  };

  constructor() {
    super(
      "OpenAlex",
      "Integration with OpenAlex knowledge graph using REST API",
    );
  }

  async searchEntities(
    query: string,
    options: QueryOptions = {},
  ): Promise<ExternalEntity[]> {
    // We'll search for works (papers), authors, and concepts
    // For simplicity, default to searching authors and concepts
    const limit = options.limit || 10;
    const url = `${this.baseUrl}/authors?search=${encodeURIComponent(query)}&per-page=${limit}`;
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) {
      throw new Error(
        `OpenAlex query failed: ${response.statusText} (${response.status})`,
      );
    }
    const data = await response.json();
    // Map OpenAlex authors to ExternalEntity
    const authors: ExternalEntity[] = (data.results || []).map(
      (author: any) => ({
        id: author.id,
        name: author.display_name,
        type: "Author",
        description:
          author.last_known_institution?.display_name ||
          author.orcid ||
          undefined,
        source: "OpenAlex",
        properties: {
          orcid: author.orcid,
          works_count: author.works_count,
          cited_by_count: author.cited_by_count,
          last_known_institution: author.last_known_institution?.display_name,
        },
      }),
    );
    // Optionally, you could also search concepts or works here
    return authors;
  }

  async getEntityRelations(
    entityId: string,
    options: QueryOptions = {},
  ): Promise<ExternalRelation[]> {
    // For authors, get co-authorships (works with multiple authors)
    // We'll fetch works for the author and extract co-authors
    const limit = options.limit || 10;
    const url = `${this.baseUrl}/works?filter=author.id:${encodeURIComponent(entityId)}&per-page=${limit}`;
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) {
      throw new Error(
        `OpenAlex relation query failed: ${response.statusText} (${response.status})`,
      );
    }
    const data = await response.json();
    const relations: ExternalRelation[] = [];
    for (const work of data.results || []) {
      const coAuthors = (work.authorships || [])
        .map((a: any) => a.author.id)
        .filter((id: string) => id && id !== entityId);
      for (const coAuthorId of coAuthors) {
        relations.push({
          from: entityId,
          to: coAuthorId,
          type: "coauthor",
          source: "OpenAlex",
          properties: {
            work_id: work.id,
            work_title: work.title,
          },
        });
      }
    }
    return relations;
  }
}
