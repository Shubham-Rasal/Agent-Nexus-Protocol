import { WorkflowContext } from "../registry/types";

export interface TaskIntent {
  id: string;
  name: string;
  description: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export interface SubTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId: string;
  confidence: number;
  result?: any;
  error?: string;
  subtasks?: SubTask[];
  parameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface DecomposedTask {
  originalQuery: string;
  mainIntent: TaskIntent;
  subtasks: SubTask[];
  context?: Record<string, any>;
}

export interface TaskRouterConfig {
  intentRecognitionThreshold: number;
  maxSubtasks: number;
  defaultAgentId?: string;
}

export interface TaskRouterOptions {
  workflowContext?: WorkflowContext;
  config?: TaskRouterConfig;
}

export interface IntentPattern {
  id: string;
  pattern: string | RegExp;
  examples: string[];
  workflowId?: string;
  priority: number;
}

export interface TaskRouter {
  // Core routing methods
  routeTask: (query: string, options?: TaskRouterOptions) => Promise<DecomposedTask>;
  executeTask: (task: DecomposedTask) => Promise<any>;
  
  // Intent management
  registerIntent: (intent: IntentPattern) => void;
  unregisterIntent: (intentId: string) => void;
  getRegisteredIntents: () => IntentPattern[];
  
  // Configuration
  setConfig: (config: Partial<TaskRouterConfig>) => void;
  getConfig: () => TaskRouterConfig;
} 