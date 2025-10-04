import { Globe, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-foreground/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
              <a href="#" className="hover:opacity-60 transition-opacity">
                [MCP Docs]
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity">
                [Docs]
              </a>
              <a href="https://www.youtube.com/@shubham_rasal" className="hover:opacity-60 transition-opacity">
                [YouTube]
              </a>
              <a href="https://github.com/Shubham-Rasal/Agent-Nexus-Protocol/tree/master/groundline" className="hover:opacity-60 transition-opacity">
                 [GitHub]
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Launch App
            </Link>
            {/* <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full border border-foreground/20">
                <Circle className="h-3 w-3 fill-current" />
              </Button>
            </div> */}
          </div>
        </nav>
      </div>
    </header>
  )
}
