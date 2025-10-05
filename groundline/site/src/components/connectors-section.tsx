"use client"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

const connectors = [
  { 
    name: "README.md", 
    status: "Available", 
    icon: "📄", 
    description: "Built-in markdown connector",
    link: "#"
  },
  { 
    name: "Obsidian Plugin", 
    status: "Available", 
    icon: "🗒️", 
    description: "Filecoin backup for Obsidian vaults",
    link: "https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline-obsidian-plugin"
  },
  { 
    name: "Notion", 
    status: "Coming Soon", 
    icon: "📝", 
    description: "Sync Notion databases and pages",
    link: "#"
  },
  { 
    name: "RSS Feed", 
    status: "Coming Soon", 
    icon: "📡", 
    description: "Ingest content from RSS feeds",
    link: "#"
  },
  { 
    name: "GitHub", 
    status: "Coming Soon", 
    icon: "🔀", 
    description: "Connect GitHub repositories",
    link: "#"
  },
]

export function ConnectorsSection() {
  return (
    <section id="connectors" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Available Plugins</h2>
        <p className="text-muted-foreground">Connect your data sources with our growing ecosystem of plugins</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((connector, index) => (
          <Card
            key={index}
            className="border border-foreground/10 bg-card p-6 hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{connector.icon}</span>
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
            {connector.status === "Available" && connector.link !== "#" ? (
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
        ))}
      </div>

    </section>
  )
}
