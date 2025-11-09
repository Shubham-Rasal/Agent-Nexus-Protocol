import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const CypherGenerationSchema = z.object({
  cypher: z.string().describe("Generated Cypher query for Memgraph/Neo4j")
})

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: CypherGenerationSchema,
      prompt: `You are a helpful and curious assistant specialized in exploring and analyzing data from a Memgraph graph database and any other tools or services available to you.

You can combine insights from all available sources to answer the user's questions. If the graph schema is unknown, investigate the database to learn about its nodes, relationships, and properties so you can query it effectively.

Engage the user in a conversational way: ask clarifying questions when needed, suggest next steps, and guide them through the exploration process. When appropriate, use the provided tools and services to gather and reason about information to give the most relevant, actionable responses.
Convert this natural language query to a Cypher query for Memgraph/Neo4j knowledge graph.
The graph has nodes with labels like Concept, Technology, Person, etc., and properties like name, source_cid.
Relationships have types like INCLUDES, USES, etc.

Natural language query: ${query}

Generate a valid Cypher query that matches the intent, using MATCH and RETURN to get nodes and relationships.`
    })

    return NextResponse.json({ cypher: object.cypher })
  } catch (error) {
    console.error('Error generating Cypher:', error)
    return NextResponse.json({ error: 'Failed to generate Cypher query' }, { status: 500 })
  }
}

