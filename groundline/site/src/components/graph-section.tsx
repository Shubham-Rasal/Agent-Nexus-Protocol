"use client"

import { Card } from "@/components/ui/card"
import * as d3 from "d3"
import { useRef, useEffect, useState } from "react"
import neo4j from "neo4j-driver"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Record as NeoRecord } from "neo4j-driver"

const recentQueries = [
  { query: "show research notes about decentralized AI", results: 42, time: "0.3s" },
  { query: "find all documents mentioning Filecoin", results: 156, time: "0.5s" },
  { query: "knowledge graph architecture patterns", results: 28, time: "0.4s" },
  { query: "MCP API integration examples", results: 67, time: "0.2s" },
]

interface GraphNode {
  id: string
  name: string
  type: string
  properties: Record<string, any>
  x?: number
  y?: number
  vx?: number
  vy?: number
  index?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

const getNodeColor = (type: string) => {
  const colors = {
    Concept: "#f0f0f0",
    Technology: "#e0e0e0",
    Person: "#d0d0d0",
    Organization: "#c0c0c0",
    Dataset: "#b0b0b0",
    Paper: "#a0a0a0",
    Project: "#909090",
  }
  return colors[type as keyof typeof colors] || "#808080"
}

const sampleGraphData: GraphData = {
  nodes: [
    { id: "1", name: "AI", type: "Concept", properties: {} },
    { id: "2", name: "Machine Learning", type: "Technology", properties: {} },
    { id: "3", name: "Neural Network", type: "Technology", properties: {} },
    { id: "4", name: "Deep Learning", type: "Technology", properties: {} },
    { id: "5", name: "Tom Hanks", type: "Person", properties: {} },
    { id: "6", name: "OpenAI", type: "Organization", properties: {} },
    { id: "7", name: "MNIST", type: "Dataset", properties: {} },
    { id: "8", name: "Attention Paper", type: "Paper", properties: {} },
    { id: "9", name: "GPT Project", type: "Project", properties: {} },
  ],
  links: [
    { source: "1", target: "2", type: "INCLUDES" },
    { source: "2", target: "3", type: "USES" },
    { source: "3", target: "4", type: "TYPE_OF" },
    { source: "6", target: "9", type: "DEVELOPS" },
    { source: "5", target: "1", type: "STUDIES" },
    { source: "4", target: "7", type: "TRAINS_ON" },
    { source: "8", target: "4", type: "DESCRIBES" },
  ]
}

export function GraphSection() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [graphData, setGraphData] = useState<GraphData>(sampleGraphData)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [nlpQuery, setNlpQuery] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)
  const [formattedResponse, setFormattedResponse] = useState<any | null>(null)

  // Add state
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalConnections: 0,
    entities: 0,
    concepts: 0
  })

  useEffect(() => {
    const driver = neo4j.driver("bolt://localhost:7687")
    const session = driver.session()

    const fetchGraphData = async () => {
      try {
        const result = await session.run(
          "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50"
        )

        const nodes: Map<string, GraphNode> = new Map()
        const links: GraphLink[] = []

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

        setGraphData({
          nodes: Array.from(nodes.values()),
          links
        })
        setIsConnected(true)
        setConnectionError(null)
      } catch (error: any) {
        console.error("Memgraph connection error:", error)
        setIsConnected(false)
        setConnectionError(error.message || "Connection failed")
        setGraphData(sampleGraphData) // Fallback to sample data
      } finally {
        await session.close()
        await driver.close()
      }
    }

    const fetchStats = async () => {
      const driver = neo4j.driver("bolt://localhost:7687")
      const session = driver.session()
      try {
        const nodesResult = await session.run("MATCH (n) RETURN count(n) as count")
        const relsResult = await session.run("MATCH ()-[r]-() RETURN count(r) as count")
        const entitiesResult = await session.run("MATCH (n) WHERE n.type IN ['Person', 'Organization'] RETURN count(n) as count")
        const conceptsResult = await session.run("MATCH (n) WHERE n.type IN ['Concept', 'Technology'] RETURN count(n) as count")

        setStats({
          totalNodes: nodesResult.records[0].get('count').toNumber(),
          totalConnections: relsResult.records[0].get('count').toNumber(),
          entities: entitiesResult.records[0].get('count').toNumber(),
          concepts: conceptsResult.records[0].get('count').toNumber()
        })
      } catch (error) {
        console.error("Stats fetch error:", error)
      } finally {
        await session.close()
        await driver.close()
      }
    }

    fetchGraphData()
    fetchStats()

  }, [])

  const handleExecuteQuery = async () => {
    if (!nlpQuery.trim()) return

    setIsQuerying(true)
    setConnectionError(null)

    try {
      // Fetch Cypher from API
      const response = await fetch('/api/generate-cypher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlpQuery })
      })

      if (!response.ok) {
        throw new Error('Failed to generate Cypher')
      }

      const { cypher } = await response.json()

      // Execute in Memgraph
      const driver = neo4j.driver("bolt://localhost:7687")
      const session = driver.session()

      try {
        const result = await session.run(cypher)

        const nodes: Map<string, GraphNode> = new Map()
        const links: GraphLink[] = []

        result.records.forEach(record => {
          // Assuming the query returns n, r, m like before
          const keys = record.keys
          keys.forEach(key => {
            const item = record.get(key)
            if (item && item.start && item.end) { // It's a relationship
              links.push({
                source: item.start.toString(),
                target: item.end.toString(),
                type: item.type
              })
            } else if (item && item.identity) { // It's a node
              if (!nodes.has(item.identity.toString())) {
                nodes.set(item.identity.toString(), {
                  id: item.identity.toString(),
                  name: item.properties?.name || item.labels?.[0] || "Unknown",
                  type: item.labels?.[0] || "Node",
                  properties: item.properties || {}
                })
              }
            }
          })
        })

        setGraphData({
          nodes: Array.from(nodes.values()),
          links
        })

        const records = result.records.map((record: NeoRecord) => {
          const obj: Record<string, any> = {}
          record.forEach((value: any, key: PropertyKey) => {
            obj[String(key)] = value
          })
          return obj
        })

        const formatResponse = await fetch('/api/format-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: records, originalQuery: nlpQuery })
        })

        if (formatResponse.ok) {
          const formatted = await formatResponse.json()
          setFormattedResponse(formatted)
        } else {
          console.error('Failed to format results')
        }

      } finally {
        await session.close()
        await driver.close()
      }

    } catch (error: any) {
      console.error("Query error:", error)
      setConnectionError(error.message || "Query failed")
    } finally {
      setIsQuerying(false)
    }
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(svgRef.current)
    const width = svg.node()?.clientWidth || 500
    const height = 400

    svg.selectAll("*").remove()

    const g = svg.append("g")

    const nodes: GraphNode[] = graphData.nodes.map(d => ({ ...d })) // Copy to avoid mutation
    const links: (GraphLink & { source: GraphNode & d3.SimulationNodeDatum; target: GraphNode & d3.SimulationNodeDatum })[] = graphData.links.map(link => {
      const source = typeof link.source === "string" ? nodes.find(n => n.id === link.source)! : link.source
      const target = typeof link.target === "string" ? nodes.find(n => n.id === link.target)! : link.target
      return { ...link, source, target }
    })

    const simulation: d3.Simulation<GraphNode & d3.SimulationNodeDatum, undefined> = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999999")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 1.5)

    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 18)
      .attr("fill", d => getNodeColor(d.type))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event: any, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event: any, d: GraphNode) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event: any, d: GraphNode) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on("click", (event: MouseEvent, d: GraphNode) => {
        setSelectedNode(d)
      })

    const nodeLabel = g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("font-size", "11px")
      .attr("fill", "#333333")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name)

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoomBehavior)

    // Define a type alias for the simulation link
    type SimLink = typeof links[0]

    // In tick:
    simulation.on("tick", () => {
      link
        .attr("x1", (d: SimLink) => (typeof d.source === "object" ? d.source.x : 0) || 0)
        .attr("y1", (d: SimLink) => (typeof d.source === "object" ? d.source.y : 0) || 0)
        .attr("x2", (d: SimLink) => (typeof d.target === "object" ? d.target.x : 0) || 0)
        .attr("y2", (d: SimLink) => (typeof d.target === "object" ? d.target.y : 0) || 0)

      node.attr("cx", (d: GraphNode) => d.x || 0).attr("cy", (d: GraphNode) => d.y || 0)

      nodeLabel.attr("x", (d: GraphNode) => d.x || 0).attr("y", (d: GraphNode) => d.y || 0)
    })

  }, [graphData]) // Depend on graphData

  return (
    <section id="graph" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Graph</h2>
        <p className="text-muted-foreground">Explore your knowledge graph and query history</p>
        {isConnected ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" /> Connected to Memgraph
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" /> {connectionError || "Not connected to Memgraph"}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Nodes</div>
          <div className="text-3xl font-light">{stats.totalNodes}</div>
        </Card>
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="text-sm text-muted-foreground mb-2">Connections</div>
          <div className="text-3xl font-light">{stats.totalConnections}</div>
        </Card>
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="text-sm text-muted-foreground mb-2">Entities</div>
          <div className="text-3xl font-light">{stats.entities}</div>
        </Card>
        <Card className="border border-foreground/10 bg-card p-6">
          <div className="text-sm text-muted-foreground mb-2">Concepts</div>
          <div className="text-3xl font-light">{stats.concepts}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-foreground/10 bg-card p-6">
          <h3 className="text-xl font-light mb-4">Graph Visualization</h3>
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-white p-4 border rounded shadow">
              <h4>{selectedNode.name}</h4>
              <p>Type: {selectedNode.type}</p>
              <button onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          )}
          <svg ref={svgRef} width="100%" height="400" className="border border-foreground/10 rounded" viewBox="0 0 500 400"></svg>
        </Card>

        <Card className="border border-foreground/10 bg-card p-6">
          <h3 className="text-xl font-light mb-4">Query Interface</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Enter your query</label>
              <input
                type="text"
                placeholder="e.g., show research notes about decentralized AI"
                className="w-full px-4 py-3 border border-foreground/20 rounded bg-background focus:outline-none focus:border-foreground/40 transition-colors"
                value={nlpQuery}
                onChange={(e) => setNlpQuery(e.target.value)}
              />
            </div>
            <button
              className="w-full px-4 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              onClick={handleExecuteQuery}
              disabled={isQuerying}
            >
              {isQuerying ? "Executing..." : "Execute Query"}
            </button>
            {formattedResponse && (
              <div className="mt-4 p-4 border rounded bg-background">
                <h4 className="font-bold mb-2">Query Response</h4>
                <p><strong>Summary:</strong> {formattedResponse.summary as string}</p>
                <h5 className="font-semibold mt-2">Key Findings:</h5>
                <ul className="list-disc pl-4">
                  {(formattedResponse.keyFindings as string[]).map((finding: string, i: number) => (
                    <li key={i}>{finding}</li>
                  ))}
                </ul>
                <h5 className="font-semibold mt-2">Results:</h5>
                {(formattedResponse.formattedResults as Array<{description: string; details: Record<string, any>}>).map((res, i) => (
                  <div key={i} className="mt-2">
                    <p>{res.description}</p>
                    <pre className="text-sm">{JSON.stringify(res.details, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4 border-t border-foreground/10">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">API Endpoint</div>
              <div className="bg-background border border-foreground/10 p-3 rounded font-mono text-xs overflow-x-auto">
                <code className="text-muted-foreground">POST https://api.yourgraph.io/mcp/query</code>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-foreground/10 bg-card p-6">
        <h3 className="text-xl font-light mb-4">Recent Queries</h3>
        <div className="space-y-3">
          {recentQueries.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-foreground/5 last:border-0"
            >
              <div className="flex-1">
                <div className="text-sm font-mono">{item.query}</div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{item.results} results</span>
                <span>{item.time}</span>
                <button className="text-foreground hover:opacity-60 transition-opacity">→</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
