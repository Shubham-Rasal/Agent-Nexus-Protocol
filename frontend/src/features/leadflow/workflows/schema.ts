import { ReactNode } from 'react';

export interface NodeData {
  label: string;
  description?: string;
  icon?: ReactNode;
  type: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  config?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: {
    condition?: string;
    conditionType?: string;
    sourceOutput?: string;
    expectedValue?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt?: string;
  updatedAt?: string;
}

export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  DELAY: 'delay',
  AGENT: 'agent',
  INPUT: 'input',
  OUTPUT: 'output',
};

export const WORKFLOW_TYPES = {
  LEAD_GENERATION: 'lead_generation',
  CUSTOMER_ONBOARDING: 'customer_onboarding',
  SALES_FOLLOW_UP: 'sales_follow_up',
  SUPPORT_AUTOMATION: 'support_automation',
}; 