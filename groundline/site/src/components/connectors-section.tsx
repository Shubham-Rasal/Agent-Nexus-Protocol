import { Card } from "@/components/ui/card"

const connectors = [
  { name: "Notion", status: "Connected", icon: "📝", lastSync: "2 minutes ago" },
  { name: "Obsidian", status: "Connected", icon: "🗒️", lastSync: "5 minutes ago" },
  { name: "Git Repository", status: "Connected", icon: "🔀", lastSync: "1 hour ago" },
  { name: "Google Drive", status: "Not Connected", icon: "📁", lastSync: "—" },
  { name: "RSS Feeds", status: "Connected", icon: "📡", lastSync: "10 minutes ago" },
]

export function ConnectorsSection() {
  return (
    <section id="connectors" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Connectors</h2>
        <p className="text-muted-foreground">Manage your data sources and sync settings</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((connector, index) => (
          <Card
            key={index}
            className="border border-foreground/10 bg-card p-6 hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl grayscale">{connector.icon}</span>
              <span
                className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded ${
                  connector.status === "Connected" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                }`}
              >
                {connector.status}
              </span>
            </div>
            <h3 className="text-xl font-light mb-2">{connector.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Last sync: {connector.lastSync}</p>
            <button className="w-full px-4 py-2 border border-foreground/20 rounded text-sm hover:bg-foreground/5 transition-colors">
              {connector.status === "Connected" ? "Configure" : "Connect"}
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <button className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
          + Add New Connector
        </button>
      </div>
    </section>
  )
}
