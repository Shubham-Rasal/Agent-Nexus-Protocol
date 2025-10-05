"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { WalletButton } from "@/components/wallet-button"

const sections = [
  { id: "connectors", label: "Connectors", icon: "🔗", path: "/app/connectors" },
  { id: "payment", label: "Payment", icon: "💳", path: "/app/payment" },
  { id: "stored-data", label: "Stored Data", icon: "💾", path: "/app/stored-data" },
  { id: "graph", label: "Graph", icon: "🕸️", path: "/app/graph" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-foreground/10 bg-background p-6 flex flex-col">
      <div className="mb-8">
        <Link href="/" className="text-xl font-light hover:opacity-60 transition-opacity">
          ← Back to Home
        </Link>
      </div>

      <nav className="space-y-2">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.path}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-colors",
              pathname === section.path ? "bg-foreground text-background" : "hover:bg-foreground/5",
            )}
          >
            <span className="text-xl">{section.icon}</span>
            <span className="font-mono text-sm uppercase tracking-wider">{section.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-12 pt-6 border-t border-foreground/10">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</div>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 border border-foreground/20 rounded text-sm hover:bg-foreground/5 transition-colors">
            Add Connector
          </button>
          <button className="w-full px-4 py-2 border border-foreground/20 rounded text-sm hover:bg-foreground/5 transition-colors">
            View API Docs
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-foreground/10">
        <WalletButton />
      </div>
    </aside>
  )
}