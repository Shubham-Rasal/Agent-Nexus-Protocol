import { Card } from "@/components/ui/card"
import { LineArtLeft } from "@/components/line-art-left"
import { LineArtRight } from "@/components/line-art-right"

export function FeaturedCards() {
  return (
    <section className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider">/ How It Works</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="border border-foreground/20 bg-card overflow-hidden">
          <div className="aspect-[4/3] bg-background border-b border-foreground/20 flex items-center justify-center p-8">
            <LineArtLeft />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-light">1</span>
              <h3 className="text-2xl font-light">Connect Your Sources</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Plug in Notion, Obsidian, Git repos, or any knowledge base. The system automatically syncs and normalizes
              your data.
            </p>
          </div>
        </Card>

        <Card className="border border-foreground/20 bg-card overflow-hidden">
          <div className="aspect-[4/3] bg-background border-b border-foreground/20 flex items-center justify-center p-8">
            <LineArtRight />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-light">2</span>
              <h3 className="text-2xl font-light">Generate a Verifiable Knowledge Graph</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your content is chunked, embedded, and mapped into an interconnected graph of entities and relationships —
              stored securely on <strong>Filecoin</strong> with verifiable proofs of origin.
            </p>
          </div>
        </Card>

        <Card className="border border-foreground/20 bg-card overflow-hidden">
          <div className="aspect-[4/3] bg-background border-b border-foreground/20 flex items-center justify-center p-8">
            <LineArtLeft />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-light">3</span>
              <h3 className="text-2xl font-light">Query via API or Interface</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ask questions, search semantically, or navigate visually. Each retrieved passage is backed by{" "}
              <strong>cryptographic proof</strong> of authenticity and storage.
            </p>
          </div>
        </Card>

        <Card className="border border-foreground/20 bg-card overflow-hidden">
          <div className="aspect-[4/3] bg-background border-b border-foreground/20 flex items-center justify-center p-8">
            <LineArtRight />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-light">4</span>
              <h3 className="text-2xl font-light">Build on Top</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Access the graph through a standard <strong>MCP-compatible API</strong>, perfect for AI agents, RAG
              pipelines, and decentralized apps.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
