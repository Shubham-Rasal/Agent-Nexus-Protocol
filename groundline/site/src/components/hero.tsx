export function Hero() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-4xl">
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
          <button className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
            Start Building Your Knowledge Graph →
          </button>
          <button className="px-6 py-3 border border-foreground/20 font-mono text-sm uppercase tracking-wider hover:bg-foreground/5 transition-colors">
            View Live Demo
          </button>
        </div>
      </div>
    </section>
  )
}
