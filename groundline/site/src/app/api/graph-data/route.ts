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
      const result = await session.run(
        "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50"
      )

      const nodes: Map<string, any> = new Map()
      const links: any[] = []

      result.records.forEach(record => {
        const source = record.get("n")
        const target = record.get("m")
        const rel = record.get("r")

        if (!nodes.has(source.identity.toString())) {
          nodes.set(source.identity.toString(), {
            id: source.identity.toString(),
            name: source.properties.name || source.labels[0] || "Unknown",
            type: source.labels[0] || "Node",
            properties: source.properties
          })
        }

        if (!nodes.has(target.identity.toString())) {
          nodes.set(target.identity.toString(), {
            id: target.identity.toString(),
            name: target.properties.name || target.labels[0] || "Unknown",
            type: target.labels[0] || "Node",
            properties: target.properties
          })
        }

        links.push({
          source: source.identity.toString(),
          target: target.identity.toString(),
          type: rel.type
        })
      })

      return NextResponse.json({
        nodes: Array.from(nodes.values()),
        links
      })
    } finally {
      await session.close()
      await driver.close()
    }
  } catch (error) {
    console.error("Graph data fetch error:", error)
    return NextResponse.json({ 
      error: 'Failed to fetch graph data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
