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
      prompt: `Convert this natural language query to a Cypher query for Memgraph/Neo4j knowledge graph.
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

