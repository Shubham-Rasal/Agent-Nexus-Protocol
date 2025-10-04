import { NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'

export async function POST(req: Request) {
  try {
    const { cypher } = await req.json()
    
    if (!cypher) {
      return NextResponse.json({ error: 'Cypher query is required' }, { status: 400 })
    }

    const MEMGRAPH_URI = process.env.MEMGRAPH_URI!;
    const MEMGRAPH_USERNAME = process.env.MEMGRAPH_USERNAME!;
    const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD!;
    
    const driver = neo4j.driver(MEMGRAPH_URI, neo4j.auth.basic(MEMGRAPH_USERNAME, MEMGRAPH_PASSWORD), {
      disableLosslessIntegers: true
    })
    const session = driver.session()

    try {
      const result = await session.run(cypher)

      // Convert Neo4j records to plain JavaScript objects
      const records = result.records.map(record => {
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

      return NextResponse.json({ records })
    } finally {
      await session.close()
      await driver.close()
    }
  } catch (error) {
    console.error("Cypher execution error:", error)
    return NextResponse.json({ 
      error: 'Failed to execute Cypher query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
