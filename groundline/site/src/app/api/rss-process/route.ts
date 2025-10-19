import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import neo4j from 'neo4j-driver';

// Define schema for entities and relationships
const EntitySchema = z.object({
  id: z.string().describe("Unique identifier for the entity"),
  type: z.string().describe("Type of entity (e.g., Person, Concept, Organization, Article)"),
  properties: z.record(z.string(), z.any()).describe("Key-value pairs of entity properties"),
});

const RelationshipSchema = z.object({
  from: z.string().describe("Source entity ID"),
  to: z.string().describe("Target entity ID"),
  type: z.string().describe("Type of relationship"),
  properties: z.record(z.string(), z.any()).optional().describe("Optional relationship properties"),
});

const KnowledgeGraphSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  content?: string;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  data?: any;
}

/**
 * Parse RSS feed from URL
 */
async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GroundlineBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Simple XML parsing (in production, use a proper XML parser like 'fast-xml-parser')
    const items: RSSItem[] = [];
    
    // Match all <item> or <entry> tags (for RSS and Atom feeds)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    const matches = xmlText.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemContent = match[1] || match[2];
      
      // Extract title
      const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? stripCDATA(titleMatch[1]) : '';
      
      // Extract link
      const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>|<link[^>]*href=["']([^"']+)["']/i);
      const link = linkMatch ? (stripCDATA(linkMatch[1]) || linkMatch[2] || '') : '';
      
      // Extract description
      const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>|<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const description = descMatch ? stripCDATA(stripHTML(descMatch[1])) : '';
      
      // Extract content
      const contentMatch = itemContent.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>|<content[^>]*>([\s\S]*?)<\/content>/i);
      const content = contentMatch ? stripCDATA(stripHTML(contentMatch[1])) : '';
      
      // Extract pubDate
      const pubDateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<published[^>]*>([\s\S]*?)<\/published>|<updated[^>]*>([\s\S]*?)<\/updated>/i);
      const pubDate = pubDateMatch ? stripCDATA(pubDateMatch[1]) : undefined;
      
      if (title || description || content) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          description: description.trim(),
          content: content.trim(),
          pubDate,
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('RSS parsing error:', error);
    throw error;
  }
}

function stripCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripHTML(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * Extract knowledge graph from RSS items
 */
async function extractKnowledgeGraph(items: RSSItem[]) {
  // Combine all items into a structured text for analysis
  const combinedContent = items.map((item, idx) => {
    return `
Article ${idx + 1}:
Title: ${item.title}
Link: ${item.link}
Published: ${item.pubDate || 'Unknown'}
Description: ${item.description}
Content: ${item.content || item.description}
---
`;
  }).join('\n');

  const prompt = `Analyze the following RSS feed articles and extract a knowledge graph.
Identify entities (People, Organizations, Concepts, Topics, Articles) and relationships between them.

${combinedContent}

Extract meaningful entities and their relationships to build a comprehensive knowledge graph.`;

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: KnowledgeGraphSchema,
    prompt,
  });

  return result.object;
}

/**
 * Store knowledge graph in Memgraph
 */
async function storeInMemgraph(knowledgeGraph: z.infer<typeof KnowledgeGraphSchema>) {
  const MEMGRAPH_URI = process.env.MEMGRAPH_URI || 'bolt://localhost:7687';
  const MEMGRAPH_USERNAME = process.env.MEMGRAPH_USERNAME || '';
  const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD || '';

  const driver = neo4j.driver(
    MEMGRAPH_URI,
    neo4j.auth.basic(MEMGRAPH_USERNAME, MEMGRAPH_PASSWORD),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
      disableLosslessIntegers: true
    }
  );

  const session = driver.session();
  let queriesExecuted = 0;

  try {
    // Create entities in Memgraph
    for (const entity of knowledgeGraph.entities) {
      // Sanitize entity type to ensure it's a valid label
      const entityType = entity.type.replace(/[^a-zA-Z0-9_]/g, '_');
      
      const query = `
        MERGE (e:${entityType} {id: $id})
        SET e += $properties
        SET e.type = $type
        SET e.updated_at = datetime()
      `;
      await session.run(query, {
        id: entity.id,
        type: entity.type,
        properties: entity.properties,
      });
      queriesExecuted++;
    }

    // Create relationships in Memgraph
    for (const rel of knowledgeGraph.relationships) {
      // Sanitize relationship type
      const relType = rel.type.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
      
      const query = `
        MATCH (a {id: $from})
        MATCH (b {id: $to})
        MERGE (a)-[r:${relType}]->(b)
        ${rel.properties ? 'SET r += $properties' : ''}
        SET r.created_at = datetime()
      `;
      await session.run(query, {
        from: rel.from,
        to: rel.to,
        properties: rel.properties || {},
      });
      queriesExecuted++;
    }

    return queriesExecuted;
  } catch (error) {
    console.error('Memgraph storage error:', error);
    throw new Error(`Failed to store in Memgraph: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function POST(request: NextRequest) {
  const steps: ProcessingStep[] = [];
  
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'RSS feed URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch and parse RSS feed
    steps.push({ step: 'fetch_rss', status: 'in_progress' });
    const items = await parseRSSFeed(url);
    steps[steps.length - 1] = {
      step: 'fetch_rss',
      status: 'completed',
      message: `Fetched ${items.length} items from RSS feed`,
      data: { itemsCount: items.length }
    };

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items found in RSS feed',
        steps
      });
    }

    // Step 2: Extract knowledge graph
    steps.push({ step: 'extract_kg', status: 'in_progress' });
    const knowledgeGraph = await extractKnowledgeGraph(items);
    steps[steps.length - 1] = {
      step: 'extract_kg',
      status: 'completed',
      message: `Extracted ${knowledgeGraph.entities.length} entities and ${knowledgeGraph.relationships.length} relationships`,
      data: {
        entitiesCount: knowledgeGraph.entities.length,
        relationshipsCount: knowledgeGraph.relationships.length
      }
    };

    // Step 3: Store in Memgraph
    steps.push({ step: 'store_graph', status: 'in_progress' });
    const queriesExecuted = await storeInMemgraph(knowledgeGraph);
    steps[steps.length - 1] = {
      step: 'store_graph',
      status: 'completed',
      message: `Successfully stored ${queriesExecuted} queries in Memgraph knowledge graph`,
      data: { queriesExecuted }
    };

    steps.push({
      step: 'complete',
      status: 'completed',
      message: 'RSS feed processed successfully'
    });

    return NextResponse.json({
      success: true,
      itemsCount: items.length,
      entitiesCount: knowledgeGraph.entities.length,
      relationshipsCount: knowledgeGraph.relationships.length,
      queriesExecuted,
      steps,
    });

  } catch (error) {
    console.error('RSS processing error:', error);
    
    if (steps.length > 0) {
      steps[steps.length - 1].status = 'error';
      steps[steps.length - 1].message = error instanceof Error ? error.message : 'Processing failed';
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process RSS feed',
        steps,
      },
      { status: 500 }
    );
  }
}

