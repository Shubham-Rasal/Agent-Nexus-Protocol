"use client"

import { Card } from "@/components/ui/card"
import * as d3 from "d3"
import { useRef, useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Maximize2, Minimize2, X, ZoomIn, ZoomOut, RotateCcw, Target, Eye, EyeOff, Settings } from "lucide-react"

const faqQueries = [
  "what agents are available in the Agent Nexus Protocol?",
  "what storage systems are used in the project?",
  "what features are proposed for Agent Nexus Protocol?",
  "what tools are mentioned in the knowledge graph?",
  "what are the use cases for Agent Nexus Protocol?",
  "what components does the Decentralized AI Development SDK have?",
  "what articles has Shubham Rasal authored?",
  "what models are mentioned in the knowledge graph?",
  "what goals are set for the project?",
  "what requirements does the SDK have?",
  "what artifacts can be stored in Storacha?",
  "what skills do the agents have?",
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
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [currentZoom, setCurrentZoom] = useState(1)

  // Add state
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalConnections: 0,
    entities: 0,
    concepts: 0
  })

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch('/api/graph-data')
        if (!response.ok) {
          throw new Error('Failed to fetch graph data')
        }
        const data = await response.json()
        setGraphData(data)
        setIsConnected(true)
        setConnectionError(null)
      } catch (error: any) {
        console.error("Graph data fetch error:", error)
        setIsConnected(false)
        setConnectionError(error.message || "Connection failed")
        setGraphData(sampleGraphData) // Fallback to sample data
      }
    }



    fetchGraphData()
  }, [])

  const handleExecuteQuery = async () => {
    if (!nlpQuery.trim()) return

    setIsQuerying(true)
    setConnectionError(null)

    try {
      // Use the comprehensive query API that handles everything
      const response = await fetch('/api/user-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlpQuery })
      })

      if (!response.ok) {
        throw new Error('Failed to execute query')
      }

      const result = await response.json()
      
      // Update graph data with new results
      if (result.rawResults && result.rawResults.length > 0) {
        const nodes: Map<string, GraphNode> = new Map()
        const links: GraphLink[] = []

        result.rawResults.forEach((record: any) => {
          Object.values(record).forEach((item: any) => {
            if (item && item.start && item.end) { // It's a relationship
              links.push({
                source: item.start.toString(),
                target: item.end.toString(),
                type: item.type
              })
            } else if (item && item.id && item.labels) { // It's a node
              if (!nodes.has(item.id)) {
                nodes.set(item.id, {
                  id: item.id,
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
      }

      // Set formatted response
      if (result.formattedResponse) {
        setFormattedResponse(result.formattedResponse)
      }

    } catch (error: any) {
      console.error("Query error:", error)
      setConnectionError(error.message || "Query failed")
    } finally {
      setIsQuerying(false)
    }
  }

  // Graph control functions
  const centerGraph = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")
      
      // Reset zoom and pan
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      )
    }
  }

  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.5
      )
      setCurrentZoom(prev => prev * 1.5)
    }
  }

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1 / 1.5
      )
      setCurrentZoom(prev => prev / 1.5)
    }
  }

  const fitToScreen = () => {
    if (svgRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")
      
      // Get bounds of all nodes
      const gNode = g.node() as SVGGraphicsElement
      const bounds = gNode?.getBBox()
      if (bounds) {
        const fullWidth = svg.node()?.clientWidth || 500
        const fullHeight = svg.node()?.clientHeight || 400
        const width = bounds.width
        const height = bounds.height
        const midX = bounds.x + width / 2
        const midY = bounds.y + height / 2
        
        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.8
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY]
        
        svg.transition().duration(750).call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        )
        setCurrentZoom(scale)
      }
    }
  }

  const resetView = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      )
      setCurrentZoom(1)
    }
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(svgRef.current)
    const width = isFullScreen ? (window.innerWidth - 40) : (svg.node()?.clientWidth || 500)
    const height = isFullScreen ? (window.innerHeight - 120) : 400

    svg.selectAll("*").remove()

    const g = svg.append("g")

    const nodes: GraphNode[] = graphData.nodes.map(d => ({ ...d })) // Copy to avoid mutation
    const links: (GraphLink & { source: GraphNode & d3.SimulationNodeDatum; target: GraphNode & d3.SimulationNodeDatum })[] = graphData.links.map(link => {
      const source = typeof link.source === "string" ? nodes.find(n => n.id === link.source)! : link.source
      const target = typeof link.target === "string" ? nodes.find(n => n.id === link.target)! : link.target
      return { ...link, source, target }
    })

    const simulation: d3.Simulation<GraphNode & d3.SimulationNodeDatum, undefined> = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(10))
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
      .attr("opacity", showLabels ? 1 : 0)
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name)

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform)
        setCurrentZoom(event.transform.k)
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

  }, [graphData, isFullScreen, showLabels]) // Depend on graphData, isFullScreen, and showLabels

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

     

      <div className="grid md:grid-cols-1 gap-6 mb-8">
        {/* <Card className="border border-foreground/10 bg-card p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-light">Graph Visualization</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
              
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title={showLabels ? "Hide labels" : "Show labels"}
                >
                  {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => setIsFullScreen(true)}
                className="p-2 hover:bg-foreground/10 rounded transition-colors"
                title="View full screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mb-2 text-xs text-muted-foreground">
            Zoom: {(currentZoom * 100).toFixed(0)}% | {graphData.nodes.length} nodes, {graphData.links.length} connections
          </div>
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-white p-4 border rounded shadow z-10">
              <h4>{selectedNode.name}</h4>
              <p>Type: {selectedNode.type}</p>
              <button onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          )}
          <svg ref={svgRef} width="100%" height="400" className="border border-foreground/10 rounded" viewBox="0 0 500 400"></svg>
        </Card> */}

        <Card className="border border-foreground/10 bg-card p-6">
          <h3 className="text-xl font-light mb-4">Query Interface</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Frequently Asked Questions</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {faqQueries.map((faq, index) => (
                  <button
                    key={index}
                    onClick={() => setNlpQuery(faq)}
                    className="px-3 py-1.5 text-xs border border-foreground/20 rounded bg-background hover:bg-foreground/5 hover:border-foreground/40 transition-colors text-left"
                  >
                    {faq}
                  </button>
                ))}
              </div>
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


      {/* Full-screen modal */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-foreground/10">
            <h3 className="text-xl font-light">Graph Visualization - Full Screen</h3>
            <div className="flex items-center gap-2">
              {selectedNode && (
                <div className="bg-card p-4 border border-foreground/10 rounded shadow mr-4">
                  <h4 className="font-semibold">{selectedNode.name}</h4>
                  <p className="text-sm text-muted-foreground">Type: {selectedNode.type}</p>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="mt-2 px-3 py-1 text-xs bg-foreground/10 hover:bg-foreground/20 rounded transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              )}
              {/* Full-screen controls */}
              <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1 mr-4">
                <button
                  onClick={zoomIn}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={zoomOut}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={fitToScreen}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title="Fit to screen"
                >
                  <Target className="w-4 h-4" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-colors"
                  title={showLabels ? "Hide labels" : "Show labels"}
                >
                  {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 hover:bg-foreground/10 rounded transition-colors"
                title="Exit full screen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground border-b border-foreground/10">
            Zoom: {(currentZoom * 100).toFixed(0)}% | {graphData.nodes.length} nodes, {graphData.links.length} connections
          </div>
          <div className="flex-1 p-4">
            <svg 
              ref={svgRef} 
              width="100%" 
              height="100%" 
              className="border border-foreground/10 rounded" 
              viewBox="0 0 500 400"
            ></svg>
          </div>
        </div>
      )}
    </section>
  )
}
