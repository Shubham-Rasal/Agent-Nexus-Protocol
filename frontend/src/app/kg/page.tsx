"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  MoreVertical,
  Share2,
  Copy,
  Trash,
  Lock,
  Globe,
  Clock,
  Users,
  FolderGit2,
} from "lucide-react"

// Sample data - replace with real data from your backend
const sampleGraphs = {
  public: [
    {
      id: "1",
      name: "Movie Database",
      description: "Graph showing relationships between actors, movies, and directors",
      nodes: 1250,
      relationships: 3420,
      lastUpdated: "2024-03-10T10:30:00",
      contributors: ["John Doe", "Jane Smith"],
      tags: ["entertainment", "movies"],
    },
    {
      id: "2",
      name: "Scientific Publications",
      description: "Academic paper citations and author collaborations",
      nodes: 5000,
      relationships: 12000,
      lastUpdated: "2024-03-09T15:45:00",
      contributors: ["Alice Johnson"],
      tags: ["academic", "research"],
    },
  ],
  private: [
    {
      id: "3",
      name: "Company Network",
      description: "Internal company structure and relationships",
      nodes: 500,
      relationships: 1200,
      lastUpdated: "2024-03-11T09:15:00",
      contributors: ["Current User"],
      tags: ["internal", "organization"],
    },
  ],
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function GraphDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const filterGraphs = (graphs: typeof sampleGraphs.public) => {
    return graphs.filter(
      (graph) =>
        graph.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        graph.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        graph.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const GraphCard = ({ graph, isPublic }: { graph: (typeof sampleGraphs.public)[0]; isPublic: boolean }) => (
    <Card className="group relative">
      <Link href={`/kg/${graph.id}`} className="absolute inset-0 z-0" />
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {graph.name}
              {isPublic ? (
                <Globe className="w-4 h-4 text-green-500" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
            </CardTitle>
            <CardDescription>{graph.description}</CardDescription>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 relative z-20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 relative z-10">
        <div className="flex flex-wrap gap-2 mb-4">
          {graph.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-slate-100">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4" />
            <span>
              {graph.nodes} nodes, {graph.relationships} relationships
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDate(graph.lastUpdated)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t relative z-10">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4" />
          <span>{graph.contributors.join(", ")}</span>
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Knowledge Graphs</h1>
        <Link href="/kg/new" passHref>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Graph
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search graphs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Graphs</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="private">Private</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterGraphs([...sampleGraphs.public, ...sampleGraphs.private]).map((graph) => (
              <GraphCard
                key={graph.id}
                graph={graph}
                isPublic={sampleGraphs.public.some((g) => g.id === graph.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="public" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterGraphs(sampleGraphs.public).map((graph) => (
              <GraphCard key={graph.id} graph={graph} isPublic={true} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="private" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterGraphs(sampleGraphs.private).map((graph) => (
              <GraphCard key={graph.id} graph={graph} isPublic={false} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
