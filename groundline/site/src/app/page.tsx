import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedCards } from "@/components/featured-cards"
import { Feed } from "@/components/feed"
import { Roadmap } from "@/components/roadmap"
import { DecorativeDots } from "@/components/decorative-dots"

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <DecorativeDots />
      <Header />
      <main>
        <Hero />
        {/* <FeaturedCards /> */}
        <Feed />
        <Roadmap />
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
      </main>
    </div>
  )
}
