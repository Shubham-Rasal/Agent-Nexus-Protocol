"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Play,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Maximize,
  MoreVertical,
  Search,
  Database,
  Star,
  BookOpen,
  HelpCircle,
  FolderSyncIcon as Sync,
  Settings,
  Info,
  X,
  Pin,
  Download,
  RotateCcw,
  Menu,
  ChevronLeft,
  History,
  Upload,
  Edit,
  Globe2,
  FolderSync,
  GitCommit,
  GitBranch,
  GitMerge,
  GitPullRequest,
  ArrowRight,
  Clock,
  Home
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import * as d3 from "d3"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createGraphDB } from "@shubhamrasal/groundline"
import { sampleGraphData, sampleProvenanceData, ADAPTERS, GraphNode, GraphLink, GraphData, ProvenanceItem } from "./data/sampleGraphData"
import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ExternalEntity {
  id?: string
  name: string
  type: string
  source?: string
  properties?: Record<string, any>
  relations?: Array<{ type: string; target: string }>
  identifiers?: Record<string, string | number>
}

interface ExternalRelation {
  from: string
  to: string
  type: string
  properties?: Record<string, any>
}

interface ImportResults {
  entities: ExternalEntity[]
  relations: ExternalRelation[]
}

interface NodeNeighbor {
  id: string;
  name: string;
  type: string;
  relationship: string;
  direction: 'incoming' | 'outgoing';
}

const sidebarItems = [
  { icon: Database, label: "Database" },
  { icon: History, label: "Provenance Tracking" },
  { icon: FolderSync, label: "IPFS Sync" },
  { icon: Edit, label: "Edit Graph", active: true },
  { icon: Globe2, label: "Import External Graphs" },
  { icon: Settings, label: "Browser Settings" },
]

// Add an icon map
const iconMap = {
  GitMerge,
  GitCommit,
  GitBranch,
  GitPullRequest
} as const

const getNodeColor = (type: string) => {
  // All node types use blue shades from light to dark
  const colors = {
    Concept: "#dbeafe",      // lightest blue
    Technology: "#93c5fd",  // lighter blue
    Person: "#60a5fa",      // light blue
    Organization: "#3b82f6",// blue
    Dataset: "#2563eb",     // dark blue
    Paper: "#1d4ed8",       // darker blue
    Project: "#1e40af",     // darkest blue
  }
  return colors[type as keyof typeof colors] || "#6b7280" // gray as fallback
}

interface KnowledgeGraphProps {
  rootCID?: string;
}

interface GraphMetadata {
  nodeTypes: string[];
  relationTypes: string[];
  timestamp: number;
  version: string;
}

interface GraphDataWithMetadata extends GraphData {
  metadata: GraphMetadata;
}

export default function KnowledgeGraph({ rootCID }: KnowledgeGraphProps) {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState<GraphData>(sampleGraphData)
  const [metadata, setMetadata] = useState<GraphMetadata | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [cypherQuery, setCypherQuery] = useState('MATCH (p:Person {name:"Tom Hanks"})-[]-(m:Movie) RETURN p,m')
  const [searchTerm, setSearchTerm] = useState("")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [nodeLabels, setNodeLabels] = useState<Record<string, number>>({})
  const [relationshipTypes, setRelationshipTypes] = useState<Record<string, number>>({})
  const [nodeProperties, setNodeProperties] = useState<Set<string>>(new Set())
  const [filteredNodeTypes, setFilteredNodeTypes] = useState<Set<string>>(new Set())
  const [filteredRelationshipTypes, setFilteredRelationshipTypes] = useState<Set<string>>(new Set())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false)
  const [isIPFSDialogOpen, setIsIPFSDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncForm, setSyncForm] = useState({
    name: "",
    useCDN: false
  })
  const [isImportDrawerOpen, setIsImportDrawerOpen] = useState(false)
  const [importForm, setImportForm] = useState({
    adapter: '',
    query: ''
  })
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  const initializeGraph = useCallback(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 500

    svg.selectAll("*").remove()

    const g = svg.append("g")

    // Filter data based on current filters
    const filteredNodes = graphData.nodes.filter((node) => filteredNodeTypes.has(node.type))
    const filteredLinks = graphData.links.filter((link) => {
      const sourceNode =
        typeof link.source === "string" ? graphData.nodes.find((n) => n.id === link.source) : link.source
      const targetNode =
        typeof link.target === "string" ? graphData.nodes.find((n) => n.id === link.target) : link.target

      return (
        sourceNode &&
        targetNode &&
        filteredNodeTypes.has(sourceNode.type) &&
        filteredNodeTypes.has(targetNode.type) &&
        filteredRelationshipTypes.has(link.type)
      )
    })

    // Create simulation
    const simulation = d3
      .forceSimulation(filteredNodes)
      .force(
        "link",
        d3
          .forceLink(filteredLinks)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.5))
      .force("collision", d3.forceCollide().radius(30))

    simulationRef.current = simulation

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 1.5)

    // Create link labels
    const linkLabel = g
      .append("g")
      .selectAll("text")
      .data(filteredLinks)
      .enter()
      .append("text")
      .attr("font-size", "9px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text((d) => d.type)

    // Create nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(filteredNodes)
      .enter()
      .append("circle")
      .attr("r", 18)
      .attr("fill", (d) => getNodeColor(d.type))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
      .call(
        d3
          .drag<any, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )
      .on("click", (event, d) => {
        setSelectedNode(d)
      })
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 22).style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))")
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", 18).style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
      })

    // Create node labels
    const nodeLabel = g
      .append("g")
      .selectAll("text")
      .data(filteredNodes)
      .enter()
      .append("text")
      .attr("font-size", "11px")
      .attr("fill", "#1e293b")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .text((d) => (d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name))

    // Add zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoom(event.transform.k)
      })

    svg.call(zoomBehavior)

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

      nodeLabel.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })
  }, [graphData, filteredNodeTypes, filteredRelationshipTypes])

  useEffect(() => {
    initializeGraph()
  }, [initializeGraph])

  // Calculate statistics from data
  useEffect(() => {
    // Count node types
    const typeCounts: Record<string, number> = {}
    const propertyKeys = new Set<string>()
    
    graphData.nodes.forEach(node => {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1
      // Collect all unique property keys
      Object.keys(node.properties).forEach(key => propertyKeys.add(key))
    })
    setNodeLabels(typeCounts)
    setNodeProperties(propertyKeys)
    setFilteredNodeTypes(new Set(Object.keys(typeCounts)))

    // Count relationship types
    const relationCounts: Record<string, number> = {}
    graphData.links.forEach(link => {
      relationCounts[link.type] = (relationCounts[link.type] || 0) + 1
    })
    setRelationshipTypes(relationCounts)
    setFilteredRelationshipTypes(new Set(Object.keys(relationCounts)))
  }, [graphData])

  // Handle search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    
    if (simulationRef.current) {
      // Highlight matching nodes
      d3.selectAll("circle")
        .attr("opacity", d => {
          const node = d as GraphNode
          return node.name.toLowerCase().includes(term) ? 1 : 0.3
        })
        .attr("r", d => {
          const node = d as GraphNode
          return node.name.toLowerCase().includes(term) ? 22 : 18
        })
    }
  }

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1 / 1.5)
    }
  }

  const handleFitToScreen = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity)
    }
  }

  

  // Toggle fullscreen
  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  // Handle pin/unpin
  const handlePin = () => {
    setIsPinned(!isPinned)
    // You can implement persistence logic here
  }

  // Handle favorite
  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    // You can implement persistence logic here
  }

  // Handle rerun query
  const handleRerun = () => {
    initializeGraph()
  }

  const runQuery = () => {
    console.log("Running query:", cypherQuery)
    initializeGraph()
  }

  const toggleRelationshipType = (relType: string) => {
    const newFilteredTypes = new Set(filteredRelationshipTypes)
    if (newFilteredTypes.has(relType)) {
      newFilteredTypes.delete(relType)
    } else {
      newFilteredTypes.add(relType)
    }
    setFilteredRelationshipTypes(newFilteredTypes)
  }

  const toggleNodeType = (nodeType: string) => {
    const newFilteredTypes = new Set(filteredNodeTypes)
    if (newFilteredTypes.has(nodeType)) {
      newFilteredTypes.delete(nodeType)
    } else {
      newFilteredTypes.add(nodeType)
    }
    setFilteredNodeTypes(newFilteredTypes)
  }

  const filteredNodes = graphData.nodes.filter(
    (node) => node.name.toLowerCase().includes(searchTerm.toLowerCase()) && filteredNodeTypes.has(node.type),
  )

  const handleSidebarItemClick = (label: string) => {
    if (label === "Database") {
      router.push("/kg")
    } else if (label === "Provenance Tracking") {
      setIsProvenanceOpen(true)
    } else if (label === "IPFS Sync") {
      setIsIPFSDialogOpen(true)
    } else if (label === "Import External Graphs") {
      setIsImportDrawerOpen(true)
    }
  }

  const formatProvenanceDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }

  const handleSync = async () => {
    setIsSyncing(true)
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSyncing(false)
    setIsIPFSDialogOpen(false)
    // Reset form
    setSyncForm({ name: "", useCDN: false })
  }

  const handleImport = async () => {
    if (!importForm.adapter || !importForm.query) return

    setIsImporting(true)
    setImportResults(null)

    try {
      const graphDB = createGraphDB({
        enabledAdapters: [importForm.adapter as 'wikidata' | 'dbpedia' | 'openalex']
      })
      
      await graphDB.initialize()
      const results = await graphDB.importExternalKG(importForm.adapter, importForm.query)
      setImportResults(results)
    } catch (error) {
      console.error('Import failed:', error)
      // TODO: Show error toast
    } finally {
      setIsImporting(false)
    }
  }

  useEffect(() => {
    const loadGraphData = async () => {
      if (!rootCID) {
        setGraphData(sampleGraphData)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch the graph data directly using the CID
        const graphResponse = await fetch(`/api/kg/graph/${rootCID}`)
        if (!graphResponse.ok) {
          throw new Error('Failed to fetch graph data')
        }
        const fetchedData: GraphDataWithMetadata = await graphResponse.json()

        // Update graph data and metadata
        setGraphData({ nodes: fetchedData.nodes, links: fetchedData.links })
        setMetadata(fetchedData.metadata)

        // Update node and relationship type filters with inferred types
        setNodeLabels(
          fetchedData.metadata.nodeTypes.reduce((acc, type) => {
            acc[type] = fetchedData.nodes.filter(node => node.type === type).length
            return acc
          }, {} as Record<string, number>)
        )

        setRelationshipTypes(
          fetchedData.metadata.relationTypes.reduce((acc, type) => {
            acc[type] = fetchedData.links.filter(link => link.type === type).length
            return acc
          }, {} as Record<string, number>)
        )

        // Initialize filters to show all types
        setFilteredNodeTypes(new Set(fetchedData.metadata.nodeTypes))
        setFilteredRelationshipTypes(new Set(fetchedData.metadata.relationTypes))

      } catch (err) {
        console.error('Error loading graph data:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load graph data'
        setError(errorMessage)
        toast.error('Error loading graph', {
          description: errorMessage,
          duration: 5000,
        })
        setGraphData(sampleGraphData)
      } finally {
        setIsLoading(false)
      }
    }

    loadGraphData()
  }, [rootCID])

  const getNodeNeighbors = useCallback((nodeId: string): NodeNeighbor[] => {
    const neighbors: NodeNeighbor[] = [];
    
    graphData.links.forEach(link => {
      if (link.source === nodeId) {
        const targetNode = graphData.nodes.find(n => n.id === link.target);
        if (targetNode) {
          neighbors.push({
            id: targetNode.id,
            name: targetNode.name,
            type: targetNode.type,
            relationship: link.type,
            direction: 'outgoing'
          });
        }
      }
      if (link.target === nodeId) {
        const sourceNode = graphData.nodes.find(n => n.id === link.source);
        if (sourceNode) {
          neighbors.push({
            id: sourceNode.id,
            name: sourceNode.name,
            type: sourceNode.type,
            relationship: link.type,
            direction: 'incoming'
          });
        }
      }
    });

    return neighbors;
  }, [graphData]);

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    const neighbors = getNodeNeighbors(selectedNode.id);
    const observations: string[] = selectedNode.properties?.observations || [];

    return (
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">{selectedNode.name}</h3>
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>

        {/* Properties */}
        {Object.entries(selectedNode.properties || {}).map(([key, value]) => {
          if (key === 'observations') return null;
          return (
            <div key={key} className="mb-2">
              <span className="text-sm font-medium text-slate-700">{key}: </span>
              <span className="text-sm text-slate-600">{value as string}</span>
            </div>
          );
        })}

        {/* Observations */}
        {observations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Observations</h4>
            <ul className="list-disc pl-4 space-y-1">
              {observations.map((observation: string, index: number) => (
                <li key={index} className="text-sm text-slate-600">{observation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Neighbors */}
        {neighbors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Connected Nodes</h4>
            <div className="space-y-2">
              {neighbors.map((neighbor) => (
                <div
                  key={`${neighbor.id}-${neighbor.direction}`}
                  className="flex items-center gap-2 p-2 rounded-md bg-slate-50"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(neighbor.type) }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">{neighbor.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {neighbor.direction === 'incoming' ? (
                        <>
                          <span>← {neighbor.relationship}</span>
                        </>
                      ) : (
                        <>
                          <span>{neighbor.relationship} →</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{neighbor.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Collapsible Sidebar - Fixed */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-slate-50 border-r border-slate-200 flex flex-col h-screen transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            {!sidebarCollapsed && <h1 className="text-lg font-semibold text-slate-800">Neo4j</h1>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0 hover:bg-slate-200"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2">
            {sidebarItems.map((item, index) => (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center mx-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg transition-colors ${
                      item.active
                        ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                    onClick={() => handleSidebarItemClick(item.label)}
                  >
                    <item.icon className={`w-4 h-4 ${sidebarCollapsed ? "" : "mr-3"}`} />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="ml-2">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* Add metadata display when expanded */}
          {!sidebarCollapsed && metadata && (
            <div className="p-4 border-t">
              <h3 className="text-sm font-medium text-slate-900 mb-2">Graph Info</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>Version: {metadata.version}</p>
                <p>Last Updated: {new Date(metadata.timestamp).toLocaleString()}</p>
                <div>
                  <p className="font-medium">Node Types:</p>
                  <ul className="ml-2">
                    {metadata.nodeTypes.map(type => (
                      <li key={type}>{type}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Relation Types:</p>
                  <ul className="ml-2">
                    {metadata.relationTypes.map(type => (
                      <li key={type}>{type}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Fixed Headers */}
          <div className="flex-none">
            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 px-6 py-3">
            </div>

            {/* Query Editor */}
            <div className="bg-slate-50 border-b border-slate-200 p-1">
              <div className="flex items-start space-x-3">
                <span className="text-xs text-slate-500 mt-3 font-mono">neo4j$</span>
                <div className="flex-1">
                  <Textarea
                    value={cypherQuery}
                    onChange={(e) => setCypherQuery(e.target.value)}
                    className="font-mono text-sm border-slate-300 bg-white"
                    placeholder="Enter Cypher query..."
                  />
                </div>
                <Button 
                  onClick={runQuery} 
                  size="sm" 
                  className="mt-1 shadow-sm transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-white border-b border-slate-200 px-1 py-1">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-2">Node Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(nodeLabels).map(([type, count]) => (
                          <Badge
                            key={type}
                            variant={filteredNodeTypes.has(type) ? "default" : "secondary"}
                            className={`text-xs cursor-pointer transition-colors ${
                              filteredNodeTypes.has(type)
                                ? "hover:bg-opacity-80"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            onClick={() => toggleNodeType(type)}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full mr-1"
                              style={{ backgroundColor: getNodeColor(type) }}
                            />
                            {type} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-2">Relationship Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(relationshipTypes).map(([type, count]) => (
                          <Badge
                            key={type}
                            variant={filteredRelationshipTypes.has(type) ? "default" : "secondary"}
                            className={`text-xs cursor-pointer transition-colors ${
                              filteredRelationshipTypes.has(type)
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            onClick={() => toggleRelationshipType(type)}
                          >
                            {type} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-2">Property Keys</h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(nodeProperties).map(prop => (
                          <Badge
                            key={prop}
                            variant="secondary"
                            className="text-xs bg-slate-100 text-slate-600"
                          >
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
                    Displaying {graphData.nodes.filter(node => filteredNodeTypes.has(node.type)).length} nodes,{" "}
                    {graphData.links.filter(link => filteredRelationshipTypes.has(link.type)).length} relationships
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scrollable Graph Area */}
          <div className="flex-1 overflow-auto relative">
            {/* Graph Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 border-slate-300 w-[200px]"
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-300"
                        onClick={handleZoomIn}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom in</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-300"
                        onClick={handleZoomOut}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-300"
                        onClick={handleFitToScreen}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fit to screen</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-xs text-slate-500 ml-2">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 border-slate-300">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleFullScreen}>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    {isFullScreen ? "Exit full screen" : "Full screen"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handlePin}>
                    <Pin className={`w-4 h-4 mr-2 ${isPinned ? "text-blue-500" : ""}`} />
                    {isPinned ? "Unpin" : "Pin at top"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFavorite}>
                    <Star className={`w-4 h-4 mr-2 ${isFavorite ? "text-yellow-500" : ""}`} />
                    {isFavorite ? "Remove from favorites" : "Save as favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRerun}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rerun query
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Node Properties Popover */}
            {selectedNode && (
              <div className="absolute top-16 right-4 z-10 w-[300px]">
                {renderNodeDetails()}
              </div>
            )}

            {/* Search Results Popover */}
            {searchTerm && filteredNodes.length > 0 && (
              <div className="absolute top-16 left-4 z-10 w-[250px]">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Search Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filteredNodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center space-x-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          onClick={() => setSelectedNode(node)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                          />
                          <span className="text-xs text-slate-700">{node.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Graph Visualization */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-slate-800">Result frame views</h3>
              <svg
                ref={svgRef}
                width="100%"
                height="500"
                className="border border-slate-200 rounded-xl bg-slate-50/30"
                viewBox="0 0 800 500"
              />
            </div>
          </div>
        </div>

        {/* Provenance Tracking Drawer */}
        <Sheet open={isProvenanceOpen} onOpenChange={setIsProvenanceOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-white">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Provenance Tracking
              </SheetTitle>
              <SheetDescription>
                Track the history and origin of knowledge graph changes
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <div className="space-y-6">
                {sampleProvenanceData.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        {React.createElement(iconMap[item.icon as keyof typeof iconMap], { className: "w-5 h-5 text-blue-600" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{item.description}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatProvenanceDate(item.timestamp)}
                          <span className="px-1">•</span>
                          <span>Source: {item.source}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              +{item.changes.added}
                            </Badge>
                            <span className="text-slate-600">added</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="secondary" className="bg-red-50 text-red-700">
                              -{item.changes.removed}
                            </Badge>
                            <span className="text-slate-600">removed</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              ~{item.changes.modified}
                            </Badge>
                            <span className="text-slate-600">modified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Vertical timeline line */}
                    {item.id !== sampleProvenanceData.length && (
                      <div className="absolute left-5 top-10 bottom-0 w-[1px] bg-slate-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* IPFS Sync Dialog */}
        <Dialog open={isIPFSDialogOpen} onOpenChange={setIsIPFSDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderSync className="w-5 h-5" />
                Sync to IPFS
              </DialogTitle>
              <DialogDescription>
                Synchronize your knowledge graph with IPFS network
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="graph-name">Graph Name</Label>
                <Input
                  id="graph-name"
                  placeholder="Enter graph name"
                  value={syncForm.name}
                  onChange={(e) => setSyncForm({ ...syncForm, name: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-cdn"
                  checked={syncForm.useCDN}
                  onCheckedChange={(checked) => setSyncForm({ ...syncForm, useCDN: checked as boolean })}
                />
                <Label htmlFor="use-cdn">Use CDN for faster access</Label>
              </div>
              <Button 
                onClick={handleSync} 
                disabled={!syncForm.name || isSyncing}
                className="w-full mt-2"
              >
                {isSyncing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Syncing to IPFS...
                  </>
                ) : (
                  <>
                    <FolderSync className="w-4 h-4 mr-2" />
                    Sync to IPFS
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import External Graphs Drawer */}
        <Sheet open={isImportDrawerOpen} onOpenChange={setIsImportDrawerOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-white flex flex-col p-0">
            {/* Import drawer content remains the same */}
          </SheetContent>
        </Sheet>

        {/* Loading and error states */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-slate-600">Loading graph data...</p>
            </div>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
