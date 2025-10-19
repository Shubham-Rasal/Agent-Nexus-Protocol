import { Card } from "@/components/ui/card"
import { CheckCircle, Circle, Clock } from "lucide-react"

const roadmapItems = [
  {
    phase: "Phase 1",
    title: "Foundation & Core Infrastructure",
    status: "completed",
    items: [
      "MCP API implementation",
      "Filecoin storage integration",
      "Basic knowledge graph structure",
      "Document ingestion pipeline",
    ]
  },
  {
    phase: "Phase 2", 
    title: "Enhanced Data Processing",
    status: "in-progress",
    items: [
      "Multi-source connectors (Notion, Obsidian, etc)",
      "Advanced entity extraction",
      "Payment gateway integration (x402 protocol)",
      "Visual graph explorer",
    ]
  },
  {
    phase: "Phase 3",
    title: "Advanced Features & Scaling",
    status: "planned",
    items: [
      
      "Real-time collaboration features",
      "Advanced query capabilities",
      "Payments rails for storage"

    ]
  },
  {
    phase: "Phase 4",
    title: "Ecosystem & Integration",
    status: "planned", 
    items: [
      "Third-party integrations",
      "AI agent marketplace integration",
      "Custom graph templates",
    ]
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-6 h-6 text-green-500" />
    case "in-progress":
      return <Clock className="w-6 h-6 text-blue-500" />
    case "planned":
      return <Circle className="w-6 h-6 text-muted-foreground" />
    default:
      return <Circle className="w-6 h-6 text-muted-foreground" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "border-green-200 bg-green-50"
    case "in-progress":
      return "border-blue-200 bg-blue-50"
    case "planned":
      return "border-muted-foreground/20 bg-card"
    default:
      return "border-muted-foreground/20 bg-card"
  }
}

export function Roadmap() {
  return (
    <section className="relative min-h-screen bg-slate-50 py-24">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-6xl md:text-7xl font-light mb-4 text-balance">
            Development Roadmap
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our journey to building the future of verifiable knowledge infrastructure
          </p>
        </div>

        <div className="flex flex-col justify-center divide-y divide-slate-200">
          {roadmapItems.map((item, index) => (
            <div key={index} className="py-16">
              <div className="w-full max-w-3xl mx-auto">
                <Card className={`border-2 p-8 ${getStatusColor(item.status)}`}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                          {item.phase}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-mono uppercase tracking-wider ${
                          item.status === "completed" ? "bg-green-100 text-green-700" :
                          item.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                          "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {item.status.replace("-", " ")}
                        </span>
                      </div>
                      <h3 className="text-3xl font-light mb-6">{item.title}</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {item.items.map((subItem, subIndex) => (
                          <div key={subIndex} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-foreground/30 flex-shrink-0" />
                            <span className="text-muted-foreground">{subItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>

      
      </div>
    </section>
  )
}
