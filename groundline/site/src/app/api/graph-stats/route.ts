import { NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'

export async function GET() {
  try {
    const MEMGRAPH_URI = process.env.MEMGRAPH_URI!;
    const MEMGRAPH_USERNAME = process.env.MEMGRAPH_USERNAME!;
    const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD!;
    
    const driver = neo4j.driver(MEMGRAPH_URI, neo4j.auth.basic(MEMGRAPH_USERNAME, MEMGRAPH_PASSWORD), {
      disableLosslessIntegers: true
    })
    const session = driver.session()

    try {
      const nodesResult = await session.run("MATCH (n) RETURN count(n) as count")
      const relsResult = await session.run("MATCH ()-[r]-() RETURN count(r) as count")
      const entitiesResult = await session.run("MATCH (n) WHERE n.type IN ['Person', 'Organization'] RETURN count(n) as count")
      const conceptsResult = await session.run("MATCH (n) WHERE n.type IN ['Concept', 'Technology'] RETURN count(n) as count")

      const stats = {
        totalNodes: nodesResult.records[0].get('count').toNumber(),
        totalConnections: relsResult.records[0].get('count').toNumber(),
        entities: entitiesResult.records[0].get('count').toNumber(),
        concepts: conceptsResult.records[0].get('count').toNumber()
      }

      return NextResponse.json(stats)
    } finally {
      await session.close()
      await driver.close()
    }
  } catch (error) {
    console.error("Graph stats fetch error:", error)
    return NextResponse.json({ 
      error: 'Failed to fetch graph stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
