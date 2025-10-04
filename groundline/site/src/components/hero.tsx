import Link from "next/link"
import { KnowledgeGraphViz } from "./kg-vis"

export function Hero() {
  return (
    <section className="relative container mx-auto px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-end opacity-30">
        <div className="w-[70%] h-full">
          <KnowledgeGraphViz />
        </div>
      </div>

      <div className="relative z-10 max-w-4xl">
        <h1 className="text-7xl md:text-8xl font-light leading-[0.95] mb-8 text-balance">
          Turn your scattered
          <br />
          knowledge into a
          <br />
          verifiable, connected graph.
        </h1>
        <p className="text-xl leading-relaxed max-w-2xl">
          Aggregate notes, documents, and data from Notion, Obsidian, and more — store them permanently on{" "}
          <strong>Filecoin</strong>, and explore an <strong>auditable, queryable knowledge graph</strong> accessible via{" "}
          <strong>MCP API</strong> or web UI.
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/app">
          <button className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
            Start Building Your Knowledge Graph →
          </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
