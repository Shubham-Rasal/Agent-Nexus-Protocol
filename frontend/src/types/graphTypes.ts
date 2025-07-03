export interface GraphNode {
  id: string;
  group?: string;
  label?: string;
  x?: number;
  y?: number;
  description?: string;
  user?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
} 