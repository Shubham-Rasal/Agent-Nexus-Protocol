export interface GraphNode {
  id: string
  name: string
  type: string
  properties: Record<string, any>
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

const nodeType = {
  CONCEPT: "Concept" as const,
  TECHNOLOGY: "Technology" as const,
  PERSON: "Person" as const,
  ORGANIZATION: "Organization" as const,
  DATASET: "Dataset" as const,
  PAPER: "Paper" as const,
  PROJECT: "Project" as const
}

const linkTypes = {
  RELATED_TO: "RELATED_TO" as const,
  USES: "USES" as const,
  CREATED_BY: "CREATED_BY" as const,
  PART_OF: "PART_OF" as const,
  CITES: "CITES" as const,
  COLLABORATES: "COLLABORATES" as const
}

export const sampleGraphData: GraphData = {
  nodes: [
    // Core concepts
    { id: "ml-1", name: "Machine Learning", type: nodeType.CONCEPT, properties: { category: "core" } },
    { id: "dl-1", name: "Deep Learning", type: nodeType.CONCEPT, properties: { category: "core" } },
    { id: "ai-1", name: "Artificial Intelligence", type: nodeType.CONCEPT, properties: { category: "core" } },
    
    // Technologies
    { id: "tech-1", name: "PyTorch", type: nodeType.TECHNOLOGY, properties: { category: "framework" } },
    { id: "tech-2", name: "TensorFlow", type: nodeType.TECHNOLOGY, properties: { category: "framework" } },
    { id: "tech-3", name: "scikit-learn", type: nodeType.TECHNOLOGY, properties: { category: "library" } },
    
    // Organizations
    { id: "org-1", name: "Google AI", type: nodeType.ORGANIZATION, properties: { sector: "tech" } },
    { id: "org-2", name: "OpenAI", type: nodeType.ORGANIZATION, properties: { sector: "research" } },
    { id: "org-3", name: "DeepMind", type: nodeType.ORGANIZATION, properties: { sector: "research" } },
    
    // Datasets
    { id: "data-1", name: "ImageNet", type: nodeType.DATASET, properties: { domain: "vision" } },
    { id: "data-2", name: "MNIST", type: nodeType.DATASET, properties: { domain: "vision" } },
    { id: "data-3", name: "CIFAR-10", type: nodeType.DATASET, properties: { domain: "vision" } },
    
    // Papers
    { id: "paper-1", name: "Attention Is All You Need", type: nodeType.PAPER, properties: { year: 2017 } },
    { id: "paper-2", name: "ResNet", type: nodeType.PAPER, properties: { year: 2015 } },
    { id: "paper-3", name: "BERT", type: nodeType.PAPER, properties: { year: 2018 } },
    
    // Projects
    { id: "proj-1", name: "GPT-3", type: nodeType.PROJECT, properties: { status: "active" } },
    { id: "proj-2", name: "AlphaFold", type: nodeType.PROJECT, properties: { status: "active" } },
    { id: "proj-3", name: "LLaMA", type: nodeType.PROJECT, properties: { status: "active" } },

    // Generate additional nodes for each type
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `node-${i}`,
      name: `Entity ${i}`,
      type: Object.values(nodeType)[i % Object.values(nodeType).length],
      properties: { generated: true }
    }))
  ],
  links: [
    // Core concept relationships
    { source: "ml-1", target: "dl-1", type: linkTypes.RELATED_TO },
    { source: "dl-1", target: "ai-1", type: linkTypes.PART_OF },
    
    // Technology relationships
    { source: "tech-1", target: "ml-1", type: linkTypes.USES },
    { source: "tech-2", target: "dl-1", type: linkTypes.USES },
    { source: "tech-3", target: "ml-1", type: linkTypes.USES },
    
    // Organization relationships
    { source: "org-1", target: "tech-2", type: linkTypes.CREATED_BY },
    { source: "org-2", target: "proj-1", type: linkTypes.CREATED_BY },
    { source: "org-3", target: "proj-2", type: linkTypes.CREATED_BY },
    
    // Dataset usage
    { source: "data-1", target: "paper-1", type: linkTypes.USES },
    { source: "data-2", target: "paper-2", type: linkTypes.USES },
    { source: "data-3", target: "paper-3", type: linkTypes.USES },
    
    // Paper citations
    { source: "paper-2", target: "paper-1", type: linkTypes.CITES },
    { source: "paper-3", target: "paper-1", type: linkTypes.CITES },
    
    // Project relationships
    { source: "proj-1", target: "dl-1", type: linkTypes.USES },
    { source: "proj-2", target: "ml-1", type: linkTypes.USES },
    { source: "proj-3", target: "ai-1", type: linkTypes.USES },

    // Generate additional random connections
    ...Array.from({ length: 50 }, () => ({
      source: `node-${Math.floor(Math.random() * 30)}`,
      target: `node-${Math.floor(Math.random() * 30)}`,
      type: Object.values(linkTypes)[Math.floor(Math.random() * Object.values(linkTypes).length)]
    }))
  ]
}

export interface ProvenanceItem {
  id: number
  description: string
  type: string
  timestamp: string
  source: string
  icon: "GitMerge" | "GitCommit" | "GitBranch" | "GitPullRequest"
  changes: {
    added: number
    removed: number
    modified: number
  }
}

export const ADAPTERS = [
  {
    id: "wikidata",
    name: "Wikidata",
    description: "Open knowledge base with millions of items and properties"
  },
  {
    id: "dbpedia",
    name: "DBpedia",
    description: "Structured content from Wikipedia"
  },
  {
    id: "openalex",
    name: "OpenAlex",
    description: "Open database of scholarly papers and citations"
  }
]

export const sampleProvenanceData: ProvenanceItem[] = [
  {
    id: 1,
    description: "Initial graph import from Wikidata",
    type: "Import",
    timestamp: "2024-03-20T14:30:00Z",
    source: "Wikidata",
    icon: "GitCommit",
    changes: { added: 150, removed: 0, modified: 0 }
  },
  {
    id: 2,
    description: "Merged DBpedia entities",
    type: "Merge",
    timestamp: "2024-03-20T15:45:00Z",
    source: "DBpedia",
    icon: "GitMerge",
    changes: { added: 45, removed: 12, modified: 23 }
  },
  {
    id: 3,
    description: "Added research paper citations",
    type: "Update",
    timestamp: "2024-03-21T09:15:00Z",
    source: "OpenAlex",
    icon: "GitBranch",
    changes: { added: 78, removed: 0, modified: 5 }
  }
]