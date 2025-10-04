import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedCards } from "@/components/featured-cards"
import { Feed } from "@/components/feed"
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
      </main>
    </div>
  )
}
