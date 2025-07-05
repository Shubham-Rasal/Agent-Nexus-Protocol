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
  Clock
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import * as d3 from "d3"
import { createGraphDB } from "@shubhamrasal/groundline"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GraphNode {
  id: string
  name: string
  type: "Person" | "Movie"
  properties: Record<string, any>
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: "ACTED_IN" | "DIRECTED"
  properties?: Record<string, any>
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

const sampleGraphData: GraphData = {
  nodes: [
    { id: "tom-hanks", name: "Tom Hanks", type: "Person", properties: { born: 1956, name: "Tom Hanks" } },
    { id: "forrest-gump", name: "Forrest Gump", type: "Movie", properties: { title: "Forrest Gump", released: 1994 } },
    { id: "cast-away", name: "Cast Away", type: "Movie", properties: { title: "Cast Away", released: 2000 } },
    { id: "philadelphia", name: "Philadelphia", type: "Movie", properties: { title: "Philadelphia", released: 1993 } },
    {
      id: "saving-private-ryan",
      name: "Saving Private Ryan",
      type: "Movie",
      properties: { title: "Saving Private Ryan", released: 1998 },
    },
    {
      id: "the-green-mile",
      name: "The Green Mile",
      type: "Movie",
      properties: { title: "The Green Mile", released: 1999 },
    },
    { id: "apollo-13", name: "Apollo 13", type: "Movie", properties: { title: "Apollo 13", released: 1995 } },
    { id: "big", name: "Big", type: "Movie", properties: { title: "Big", released: 1988 } },
    {
      id: "catch-me",
      name: "Catch Me If You Can",
      type: "Movie",
      properties: { title: "Catch Me If You Can", released: 2002 },
    },
    { id: "terminal", name: "The Terminal", type: "Movie", properties: { title: "The Terminal", released: 2004 } },
    {
      id: "da-vinci",
      name: "The Da Vinci Code",
      type: "Movie",
      properties: { title: "The Da Vinci Code", released: 2006 },
    },
    // Additional person nodes
    { id: "robin-wright", name: "Robin Wright", type: "Person", properties: { born: 1966, name: "Robin Wright" } },
    { id: "gary-sinise", name: "Gary Sinise", type: "Person", properties: { born: 1955, name: "Gary Sinise" } },
    { id: "sally-field", name: "Sally Field", type: "Person", properties: { born: 1946, name: "Sally Field" } },
    {
      id: "robert-zemeckis",
      name: "Robert Zemeckis",
      type: "Person",
      properties: { born: 1951, name: "Robert Zemeckis" },
    },
    {
      id: "steven-spielberg",
      name: "Steven Spielberg",
      type: "Person",
      properties: { born: 1946, name: "Steven Spielberg" },
    },
    {
      id: "frank-darabont",
      name: "Frank Darabont",
      type: "Person",
      properties: { born: 1959, name: "Frank Darabont" },
    },
    { id: "ron-howard", name: "Ron Howard", type: "Person", properties: { born: 1954, name: "Ron Howard" } },
    {
      id: "penny-marshall",
      name: "Penny Marshall",
      type: "Person",
      properties: { born: 1943, name: "Penny Marshall" },
    },
  ],
  links: [
    { source: "tom-hanks", target: "forrest-gump", type: "ACTED_IN" },
    { source: "tom-hanks", target: "cast-away", type: "ACTED_IN" },
    { source: "tom-hanks", target: "philadelphia", type: "ACTED_IN" },
    { source: "tom-hanks", target: "saving-private-ryan", type: "ACTED_IN" },
    { source: "tom-hanks", target: "the-green-mile", type: "ACTED_IN" },
    { source: "tom-hanks", target: "apollo-13", type: "ACTED_IN" },
    { source: "tom-hanks", target: "big", type: "ACTED_IN" },
    { source: "tom-hanks", target: "catch-me", type: "ACTED_IN" },
    { source: "tom-hanks", target: "terminal", type: "ACTED_IN" },
    { source: "tom-hanks", target: "da-vinci", type: "ACTED_IN" },
    { source: "robin-wright", target: "forrest-gump", type: "ACTED_IN" },
    { source: "gary-sinise", target: "forrest-gump", type: "ACTED_IN" },
    { source: "sally-field", target: "forrest-gump", type: "ACTED_IN" },
    { source: "robert-zemeckis", target: "forrest-gump", type: "DIRECTED" },
    { source: "steven-spielberg", target: "saving-private-ryan", type: "DIRECTED" },
    { source: "frank-darabont", target: "the-green-mile", type: "DIRECTED" },
    { source: "ron-howard", target: "apollo-13", type: "DIRECTED" },
    { source: "penny-marshall", target: "big", type: "DIRECTED" },
  ],
}

const sidebarItems = [
  { icon: Database, label: "Database", active: true },
  { icon: History, label: "Provenance Tracking" },
  { icon: FolderSync, label: "IPFS Sync" },
  { icon: Edit, label: "Edit Graph" },
  { icon: Globe2, label: "Import External Graphs" },
  { icon: Settings, label: "Browser Settings" },
]

const sampleProvenanceData = [
  {
    id: 1,
    timestamp: "2024-03-15T14:30:00",
    type: "merge",
    description: "Merged knowledge from research papers database",
    source: "ResearchDB",
    changes: {
      added: 156,
      removed: 23,
      modified: 45
    },
    icon: GitMerge
  },
  {
    id: 2,
    timestamp: "2024-03-15T12:15:00",
    type: "commit",
    description: "Updated entity relationships in biotech sector",
    source: "Manual Edit",
    changes: {
      added: 12,
      removed: 5,
      modified: 8
    },
    icon: GitCommit
  },
  {
    id: 3,
    timestamp: "2024-03-14T16:45:00",
    type: "branch",
    description: "Created experimental branch for AI research",
    source: "System",
    changes: {
      added: 0,
      removed: 0,
      modified: 0
    },
    icon: GitBranch
  },
  {
    id: 4,
    timestamp: "2024-03-14T11:20:00",
    type: "pull",
    description: "Pulled updates from external knowledge base",
    source: "ExternalKB",
    changes: {
      added: 89,
      removed: 12,
      modified: 34
    },
    icon: GitPullRequest
  }
]

const ADAPTERS = [
  { id: 'wikidata', name: 'Wikidata', description: 'Structured data from Wikipedia' },
  { id: 'dbpedia', name: 'DBpedia', description: 'Linked data from Wikipedia' },
  { id: 'openalex', name: 'OpenAlex', description: 'Open academic graph' }
]

export default function Neo4jGraphBrowser() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState<GraphData>(sampleGraphData)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [cypherQuery, setCypherQuery] = useState('MATCH (p:Person {name:"Tom Hanks"})-[]-(m:Movie) RETURN p,m')
  const [searchTerm, setSearchTerm] = useState("")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [nodeLabels, setNodeLabels] = useState({ Person: 10, Movie: 10 })
  const [relationshipTypes, setRelationshipTypes] = useState({ ACTED_IN: 19, DIRECTED: 1 })
  const [filteredNodeTypes, setFilteredNodeTypes] = useState<Set<string>>(new Set(["Person", "Movie"]))
  const [filteredRelationshipTypes, setFilteredRelationshipTypes] = useState<Set<string>>(
    new Set(["ACTED_IN", "DIRECTED"]),
  )
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
  const [importResults, setImportResults] = useState<{
    entities: any[];
    relations: any[];
  } | null>(null)

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
      .force("center", d3.forceCenter(width / 2, height / 2))

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
      .attr("fill", (d) => (d.type === "Person" ? "#3b82f6" : "#f59e0b"))
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

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1 / 1.5)
    }
  }

  const handleFitToScreen = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity)
    }
  }

  const runQuery = () => {
    console.log("Running query:", cypherQuery)
    initializeGraph()
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

  const toggleRelationshipType = (relType: string) => {
    const newFilteredTypes = new Set(filteredRelationshipTypes)
    if (newFilteredTypes.has(relType)) {
      newFilteredTypes.delete(relType)
    } else {
      newFilteredTypes.add(relType)
    }
    setFilteredRelationshipTypes(newFilteredTypes)
  }

  const filteredNodes = graphData.nodes.filter(
    (node) => node.name.toLowerCase().includes(searchTerm.toLowerCase()) && filteredNodeTypes.has(node.type),
  )

  const handleSidebarItemClick = (label: string) => {
    if (label === "Provenance Tracking") {
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

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-white">
        {/* Collapsible Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out`}
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
                        <item.icon className="w-5 h-5 text-blue-600" />
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
            <div className="px-6">
              <SheetHeader className="border-b pb-6">
                <SheetTitle className="flex items-center gap-2 text-xl">
                  <Globe2 className="w-5 h-5 text-slate-600" />
                  Import External Graphs
                </SheetTitle>
                <SheetDescription className="text-slate-600">
                  Import knowledge from external graph databases
                </SheetDescription>
              </SheetHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6">
              <div className="py-6 space-y-8">
                {/* Import Form */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">Select Data Source</Label>
                    <Select
                      value={importForm.adapter}
                      onValueChange={(value) => setImportForm({ ...importForm, adapter: value })}
                    >
                      <SelectTrigger className="bg-white border-slate-200 h-12">
                        <SelectValue placeholder="Choose a data source" className="text-slate-600" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADAPTERS.map(adapter => (
                          <SelectItem key={adapter.id} value={adapter.id} className="py-3">
                            <div className="space-y-1.5">
                              <div className="font-medium text-slate-800">{adapter.name}</div>
                              <div className="text-xs text-slate-500 leading-relaxed">{adapter.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">Search Query</Label>
                    <Textarea
                      placeholder="Enter your search query..."
                      value={importForm.query}
                      onChange={(e) => setImportForm({ ...importForm, query: e.target.value })}
                      className="min-h-[120px] bg-white border-slate-200 resize-none text-slate-600 placeholder:text-slate-400"
                    />
                  </div>

                  <Button 
                    onClick={handleImport}
                    disabled={!importForm.adapter || !importForm.query || isImporting}
                    className="w-full h-12 text-base font-medium"
                  >
                    {isImporting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Importing Data...
                      </>
                    ) : (
                      <>
                        <Globe2 className="w-5 h-5 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="space-y-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-800">Import Results</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-slate-600">Entities</div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">
                          {importResults.entities.length}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-slate-600">Relations</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">
                          {importResults.relations.length}
                        </div>
                      </div>

                      <div className="col-span-2 space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">Preview</Label>
                        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2">
                          {importResults.entities.slice(0, 5).map((entity, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="font-medium text-slate-800">{entity.name}</div>
                              <div className="text-xs text-slate-500 mt-1">{entity.entityType}</div>
                            </div>
                          ))}
                          {importResults.entities.length > 5 && (
                            <div className="text-sm text-center text-slate-500 py-2">
                              And {importResults.entities.length - 5} more entities...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full h-11 border-slate-200 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setImportResults(null)
                        setImportForm({ adapter: '', query: '' })
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Results
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <span className="text-sm font-medium text-slate-700">Cypher editor</span>
                <span className="text-sm text-slate-500">Reusable result frame</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="border-slate-300 bg-transparent">
                  Run query
                </Button>
                <Button variant="outline" size="sm" className="border-slate-300 bg-transparent">
                  Full screen editor
                </Button>
              </div>
            </div>
          </div>

          {/* Query Editor */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <div className="flex items-start space-x-3">
              <span className="text-xs text-slate-500 mt-3 font-mono">neo4j$</span>
              <div className="flex-1">
                <Textarea
                  value={cypherQuery}
                  onChange={(e) => setCypherQuery(e.target.value)}
                  className="min-h-[80px] font-mono text-sm border-slate-300 bg-white resize-none"
                  placeholder="Enter Cypher query..."
                />
              </div>
              <Button onClick={runQuery} size="sm" className="mt-1 bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Graph Visualization */}
            <div className="flex-1 relative bg-white">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-300 bg-white/80 backdrop-blur-sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setIsFullScreen(!isFullScreen)}>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Full screen result frame
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <X className="w-4 h-4 mr-2" />
                      Collapse
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="w-4 h-4 mr-2" />
                      Save as Favorite
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin at top
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rerun a query
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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

            {/* Right Panel */}
            <div className="w-80 bg-slate-50/50 border-l border-slate-200 p-6 space-y-6 overflow-y-auto">
              {/* Search */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Overview */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-3">Node labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(nodeLabels).map(([label, count]) => (
                          <Badge
                            key={label}
                            variant={filteredNodeTypes.has(label) ? "default" : "secondary"}
                            className={`cursor-pointer transition-colors ${
                              filteredNodeTypes.has(label)
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            onClick={() => toggleNodeType(label)}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                label === "Person" ? "bg-blue-500" : "bg-amber-500"
                              }`}
                            />
                            {label} {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 mb-3">Relationship Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(relationshipTypes).map(([type, count]) => (
                          <Badge
                            key={type}
                            variant={filteredRelationshipTypes.has(type) ? "default" : "secondary"}
                            className={`cursor-pointer transition-colors ${
                              filteredRelationshipTypes.has(type)
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                            onClick={() => toggleRelationshipType(type)}
                          >
                            {type} {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                      Displaying {filteredNodes.length} nodes, {graphData.links.length} relationships.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Node Properties */}
              {selectedNode && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Node Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            selectedNode.type === "Person" ? "bg-blue-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-medium text-slate-800">{selectedNode.name}</span>
                      </div>
                      <div className="text-xs text-slate-500">Type: {selectedNode.type}</div>
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        {Object.entries(selectedNode.properties).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-slate-600">{key}:</span>{" "}
                            <span className="text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Zoom Controls */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start hover:bg-slate-100"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="w-4 h-4 mr-2" />
                      Zoom in
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start hover:bg-slate-100"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="w-4 h-4 mr-2" />
                      Zoom out
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start hover:bg-slate-100"
                      onClick={handleFitToScreen}
                    >
                      <Maximize className="w-4 h-4 mr-2" />
                      Fit to screen
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                    Zoom: {Math.round(zoom * 100)}%
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchTerm && (
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
                            className={`w-3 h-3 rounded-full ${node.type === "Person" ? "bg-blue-500" : "bg-amber-500"}`}
                          />
                          <span className="text-xs text-slate-700">{node.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
