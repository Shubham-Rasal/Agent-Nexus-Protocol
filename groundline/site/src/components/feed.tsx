import { Card } from "@/components/ui/card"
import {
  Link2,
  Network,
  Database,
  FileCheck,
  Radio,
  Eye,
  DollarSign,
  Users,
  GraduationCap,
  Building2,
  Blocks,
} from "lucide-react"

const features = [
  {
    icon: Link2,
    title: "Multi-source ingestion",
    description: "Notion, Obsidian, Git, Drive, RSS",
  },
  {
    icon: Network,
    title: "Embedded knowledge graph",
    description: "Auto-link entities and concepts",
  },
  {
    icon: Database,
    title: "Filecoin storage",
    description: "Verifiable, censorship-resistant, auditable",
  },
  {
    icon: FileCheck,
    title: "Cryptographic proofs",
    description: "Each retrieved passage is verifiable",
  },
  {
    icon: Radio,
    title: "MCP-compatible API",
    description: "For AI agents and retrieval pipelines",
  },
  {
    icon: Eye,
    title: "Visual explorer",
    description: "Browse your graph, documents, and provenance",
  },
  {
    icon: DollarSign,
    title: "Built-in payments",
    description: "Optional micropayments for premium retrievals",
  },
]

const useCases = [
  {
    icon: Blocks,
    title: "AI Builders",
    description: "Plug into your RAG stack for verifiable source retrieval",
  },
  {
    icon: GraduationCap,
    title: "Researchers",
    description: "Maintain permanent, linked archives of academic data",
  },
  {
    icon: Users,
    title: "Teams",
    description: "Unify knowledge across silos with provenance",
  },
  {
    icon: Building2,
    title: "Web3 Projects",
    description: "Expose project documentation and research verifiably",
  },
]

export function Feed() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="mb-24">
        <div className="mb-12">
          <h2 className="text-6xl md:text-7xl font-light mb-4 text-balance">Key Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Everything you need to build a verifiable knowledge infrastructure
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group border border-foreground/10 bg-card p-8 hover:border-foreground/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-3xl group-hover:bg-foreground/10 transition-colors duration-300 -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-light mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="mb-24">
        <div className="mb-12">
          <h2 className="text-6xl md:text-7xl font-light mb-4 text-balance">Use Cases</h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Built for teams and individuals who value data integrity
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card
                key={index}
                className="group border border-foreground/10 bg-card p-10 hover:border-foreground/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-foreground/5 rounded-full blur-3xl group-hover:bg-foreground/10 transition-colors duration-300 -ml-20 -mb-20" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-lg bg-foreground/5 flex items-center justify-center mb-5 group-hover:bg-foreground/10 transition-colors">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-light mb-4">{useCase.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{useCase.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-6xl font-light mb-8">API, Powered by x402 Protocol</h2>
        <Card className="border border-foreground/10 bg-card p-8">
          <p className="text-xl mb-6 leading-relaxed">
            <strong>Integrate in minutes.</strong> Use our SDK or REST API to query your graph, fetch verified
            documents, or connect directly to your agent framework.
          </p>
          <div className="bg-background border border-foreground/10 p-6 rounded font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground">
              {`curl -X POST https://groundline.vercel.app/api/mcp/query \\
  -d '{"query": "show research notes about decentralized AI"}'`}
            </pre>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            This query is sent to <code className="font-mono">https://groundline.vercel.app/</code> and is payment gated using HTTP <code className="font-mono">402</code> responses.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Result → JSON with text, metadata, and <code className="font-mono">proofBundle</code>.
          </p>
        </Card>
      </div>

     
    </section>
  )
}
