import { Card } from "@/components/ui/card"

import { Plug, BrainCircuit, HardDrive, ShieldCheck, Terminal, LayoutDashboard, Wallet } from "lucide-react"

const features = [
  {
    icon: <Plug className="h-8 w-8" />,
    title: "Multi-source ingestion",
    description: "Notion, Obsidian, Git, Drive, RSS",
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: "Embedded knowledge graph",
    description: "Auto-link entities and concepts",
  },
  {
    icon: <HardDrive className="h-8 w-8" />,
    title: "Filecoin storage",
    description: "Verifiable, censorship-resistant, auditable",
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "Cryptographic proofs",
    description: "Each retrieved passage is verifiable",
  },
  {
    icon: <Terminal className="h-8 w-8" />,
    title: "MCP-compatible API",
    description: "For AI agents and retrieval pipelines",
  },
  {
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: "Visual explorer",
    description: "Browse your graph, documents, and provenance",
  },
  {
    icon: <Wallet className="h-8 w-8" />,
    title: "Built-in payments",
    description: "Optional micropayments for premium retrievals",
  },
]

const useCases = [
  {
    title: "AI Builders",
    description: "Plug into your RAG stack for verifiable source retrieval",
  },
  {
    title: "Researchers",
    description: "Maintain permanent, linked archives of academic data",
  },
  {
    title: "Teams",
    description: "Unify knowledge across silos with provenance",
  },
  {
    title: "Web3 Projects",
    description: "Expose project documentation and research verifiably",
  },
]

export function Feed() {
  return (
    <section className="container mx-auto px-6 py-12">
      <div className="mb-16">
        <h2 className="text-6xl font-light mb-8">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border border-foreground/10 bg-card p-6 hover:border-foreground/30 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-light mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-6xl font-light mb-8">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="border border-foreground/10 bg-card p-6 hover:border-foreground/30 transition-colors"
            >
              <h3 className="text-2xl font-light mb-3">{useCase.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-6xl font-light mb-8">For Developers and Builders</h2>
        <Card className="border border-foreground/10 bg-card p-8">
          <p className="text-xl mb-6 leading-relaxed">
            <strong>Integrate in minutes.</strong> Use our SDK or REST API to query your graph, fetch verified
            documents, or connect directly to your agent framework.
          </p>
          <div className="bg-background border border-foreground/10 p-6 rounded font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground">
              {`curl -X POST https://api.yourgraph.io/mcp/query \\
  -d '{"query": "show research notes about decentralized AI"}'`}
            </pre>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            Result → JSON with text, metadata, and <code className="font-mono">proofBundle</code>.
          </p>
        </Card>
      </div>

      <div className="text-center py-16">
        <h2 className="text-5xl md:text-6xl font-light mb-6 text-balance">Built for the Future of Open Knowledge</h2>
        <p className="text-xl text-muted-foreground mb-4">Decentralized. Searchable. Verifiable.</p>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your data should outlive your platform — and your AI should trust its sources.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="px-8 py-4 border border-foreground/20 font-mono text-sm uppercase tracking-wider hover:bg-foreground/5 transition-colors">
            View Docs
          </button>
        </div>
      </div>
    </section>
  )
}
