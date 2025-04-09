import { ReactNode } from 'react';

export enum WorkflowDomainType {
  LEAD_GENERATION = 'lead_generation',
  CUSTOMER_SUPPORT = 'customer_support',
  RESEARCH = 'research',
  CONTENT_CREATION = 'content_creation',
  DATA_ANALYSIS = 'data_analysis',
  GENERAL = 'general',
  CUSTOM = 'custom',
  RECRUITMENT = 'recruitment',
}

export enum WorkflowCapabilityType {
  AUTOMATION = 'automation',
  ANALYSIS = 'analysis',
  GENERATION = 'generation',
  INTERACTION = 'interaction',
  MONITORING = 'monitoring',
  DECISION_MAKING = 'decision_making',
}

export interface WorkflowTool {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  authRequired: boolean;
}

export interface WorkflowNodeData {
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
  data: WorkflowNodeData;
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

export interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  domains: WorkflowDomainType[];
  capabilities: WorkflowCapabilityType[];
  author: string;
  version: string;
  isPublic: boolean;
  rating?: number;
  usageCount?: number;
  requiredTools: string[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Workflow extends WorkflowMetadata {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowContextVariable {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'session';
  ttl?: number; // Time to live in seconds
}

export interface WorkflowContext {
  workflowId: string;
  chatId: string;
  variables: WorkflowContextVariable[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface WorkflowRegistryItem {
  workflow: Workflow;
  context?: WorkflowContext;
}

export interface WorkflowRegistry {
  workflows: Record<string, WorkflowRegistryItem>;
  getWorkflow: (id: string) => WorkflowRegistryItem | undefined;
  registerWorkflow: (workflow: Workflow) => string;
  updateWorkflow: (id: string, workflow: Workflow) => boolean;
  removeWorkflow: (id: string) => boolean;
  listWorkflows: (filters?: Partial<WorkflowMetadata>) => WorkflowRegistryItem[];
}

export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  AGENT: 'agent',
  INPUT: 'input',
  OUTPUT: 'output',
  TOOL: 'tool',
}; 