"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ImportGraphDrawerProps {
  isOpen: boolean
  onClose: () => void
  onImport: (adapter: string, query: string) => Promise<void>
  isImporting: boolean
  importResults: ImportResults | null
  onAddToGraph: () => void
}

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

const ADAPTERS = [
  { id: "wikidata", name: "Wikidata" },
  { id: "dbpedia", name: "DBpedia" },
  { id: "openalex", name: "OpenAlex" }
]

export function ImportGraphDrawer({
  isOpen,
  onClose,
  onImport,
  isImporting,
  importResults,
  onAddToGraph
}: ImportGraphDrawerProps) {
  const [selectedAdapter, setSelectedAdapter] = React.useState("")
  const [query, setQuery] = React.useState("")

  const handleImport = async () => {
    if (!selectedAdapter || !query.trim()) {
      return
    }
    await onImport(selectedAdapter, query)
  }

  const renderProperties = (properties: Record<string, any> = {}) => {
    return Object.entries(properties).map(([key, value]) => (
      <Badge key={key} variant="secondary" className="mr-2 mb-2">
        {key}: {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
      </Badge>
    ))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[95vw] max-w-[800px] overflow-y-auto sm:max-w-[700px] p-6">
        <SheetHeader className="mb-6">
          <SheetTitle>Import External Graph</SheetTitle>
        </SheetHeader>
        <div className="grid gap-6">
          <div className="space-y-3">
            <Label htmlFor="adapter" className="text-base">Knowledge Source</Label>
            <Select
              value={selectedAdapter}
              onValueChange={setSelectedAdapter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a knowledge source" />
              </SelectTrigger>
              <SelectContent>
                {ADAPTERS.map((adapter) => (
                  <SelectItem key={adapter.id} value={adapter.id}>
                    {adapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label htmlFor="query" className="text-base">Query</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter your query...\nExample for Wikidata: Q7251 (Tim Berners-Lee)\nExample for DBpedia: Tim_Berners-Lee\nExample for OpenAlex: works/W2741809807`}
              className="min-h-[100px]"
            />
          </div>
          <Button 
            onClick={handleImport}
            disabled={!selectedAdapter || !query.trim() || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>

          {importResults && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Import Results</h3>
                <Button variant="outline" size="sm" onClick={onAddToGraph}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Graph
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                <div className="space-y-6 p-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Entities ({importResults.entities.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {importResults.entities.map((entity, index) => (
                          <div key={entity.id || index} className="p-4 border rounded-lg break-words">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <h4 className="font-medium">{entity.name}</h4>
                              <Badge>{entity.type}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {renderProperties(entity.properties)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Relations ({importResults.relations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {importResults.relations.map((relation, index) => (
                          <div key={index} className="p-4 border rounded-lg break-words">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="font-medium">{relation.from}</span>
                              <Badge>{relation.type}</Badge>
                              <span className="font-medium">{relation.to}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {renderProperties(relation.properties)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 