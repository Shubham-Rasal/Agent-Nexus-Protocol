import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'

const CypherGenerationSchema = z.object({
  cypher: z.string().describe("Generated Cypher query for Memgraph/Neo4j")
})

const FormattedResponseSchema = z.object({
  summary: z.string().describe("Brief summary of the query results"),
  keyFindings: z.array(z.string()).describe("List of key findings or entities"),
  formattedResults: z.array(z.object({
    description: z.string(),
    details: z.record(z.string(), z.any())
  })).describe("Formatted list of results")
})

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Step 1: Generate Cypher query from natural language
    const { object: cypherResult } = await generateObject({
      model: openai('gpt-4o'),
      schema: CypherGenerationSchema,
      prompt: `Convert this natural language query to a Cypher query for Memgraph/Neo4j knowledge graph.
The graph has nodes with labels like Concept, Technology, Person, etc., and properties like name, source_cid.
Relationships have types like INCLUDES, USES, etc.

Natural language query: ${query}

Generate a valid Cypher query that matches the intent, using MATCH and RETURN to get nodes and relationships.`
    })

    // Step 2: Execute Cypher query against database
    const driver = neo4j.driver(process.env.MEMGRAPH_URL || "bolt://localhost:7687", undefined, {
      disableLosslessIntegers: true
    })
    const session = driver.session()

    let queryResults
    try {
      const result = await session.run(cypherResult.cypher)
      
      // Convert Neo4j records to plain JavaScript objects
      queryResults = result.records.map(record => {
        const obj: Record<string, any> = {}
        record.keys.forEach(key => {
          const value = record.get(key)
          const keyStr = String(key)
          // Convert Neo4j types to plain JavaScript types
          if (value && typeof value === 'object') {
            if (value.identity !== undefined) {
              // It's a node
              obj[keyStr] = {
                id: value.identity.toString(),
                labels: value.labels,
                properties: value.properties
              }
            } else if (value.start && value.end) {
              // It's a relationship
              obj[keyStr] = {
                id: value.identity.toString(),
                type: value.type,
                start: value.start.toString(),
                end: value.end.toString(),
                properties: value.properties
              }
            } else {
              // Other object types
              obj[keyStr] = value
            }
          } else {
            obj[keyStr] = value
          }
        })
        return obj
      })
    } finally {
      await session.close()
      await driver.close()
    }

    // Step 3: Format results using AI
    const { object: formattedResult } = await generateObject({
      model: openai('gpt-4o'),
      schema: FormattedResponseSchema,
      prompt: `Format these graph query results into a human-readable response.
Original query: ${query}
Generated Cypher: ${cypherResult.cypher}

Raw results (array of records): ${JSON.stringify(queryResults)}

Provide a summary, key findings, and formatted results list.`
    })

    return NextResponse.json({
      query: query,
      cypher: cypherResult.cypher,
      rawResults: queryResults,
      formattedResponse: formattedResult
    })

  } catch (error) {
    console.error('Error processing query:', error)
    return NextResponse.json({ 
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
