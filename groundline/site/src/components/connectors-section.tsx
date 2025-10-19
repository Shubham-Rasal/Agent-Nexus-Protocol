"use client"
import { Card } from "@/components/ui/card"
import { 
  ExternalLink,
  FileText,
  StickyNote,
  Rss,
  Github,
  Database
} from "lucide-react"
import Link from "next/link"
import { RSSFeedDialog } from "@/components/rss-feed-dialog"

const connectors = [
  { 
    name: "README.md", 
    status: "Available", 
    icon: FileText, 
    description: "Built-in markdown connector",
    link: "#"
  },
  { 
    name: "Obsidian Plugin", 
    status: "Available", 
    icon: Database, 
    description: "Filecoin backup for Obsidian vaults",
    link: "https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline-obsidian-plugin"
  },
  { 
    name: "Notion", 
    status: "Available", 
    icon: StickyNote, 
    description: "Connect Notion workspaces via MCP for AI chat integration with knowledge graphs",
    link: "https://developers.notion.com/docs/mcp"
  },
  { 
    name: "RSS Feed", 
    status: "Available", 
    icon: Rss, 
    description: "Ingest content from RSS feeds with local storage",
    link: "#",
    component: true
  }
]

export function ConnectorsSection() {
  return (
    <section id="connectors" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Available Plugins</h2>
        <p className="text-muted-foreground">Connect your data sources with our growing ecosystem of plugins</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((connector, index) => {
          const Icon = connector.icon
          return (
            <Card
              key={index}
              className="group border border-foreground/10 bg-card p-6 hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <span
                  className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded ${
                    connector.status === "Available" 
                      ? "bg-green-500/10 text-green-600" 
                      : connector.status === "Coming Soon"
                      ? "bg-orange-500/10 text-orange-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {connector.status}
                </span>
              </div>
              <h3 className="text-xl font-light mb-2">{connector.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{connector.description}</p>
              {connector.status === "Available" && (connector as any).component ? (
                <RSSFeedDialog />
              ) : connector.status === "Available" && connector.link !== "#" ? (
                <Link 
                  href={connector.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 border border-foreground/20 rounded text-sm hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2"
                >
                  View Plugin
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <button 
                  disabled
                  className="w-full px-4 py-2 border border-foreground/10 rounded text-sm text-muted-foreground cursor-not-allowed"
                >
                  {connector.status === "Coming Soon" ? "Coming Soon" : "Built-in"}
                </button>
              )}
            </Card>
          )
        })}
      </div>

    </section>
  )
}
