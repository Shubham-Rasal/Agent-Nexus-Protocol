import { Workflow, WorkflowContext, WorkflowNode } from "../registry/types";
import { DecomposedTask, SubTask } from "../router/types";

export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ExecutionState {
  workflowId: string;
  chatId: string;
  status: ExecutionStatus;
  currentNodeId?: string; 
  nodeStates: Record<string, NodeExecutionState>;
  variables: Record<string, any>;
  history: Array<{
    nodeId: string;
    action: string;
    timestamp: Date;
    data?: any;
  }>;
  tasks: DecomposedTask[];
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  status: ExecutionStatus;
  outputs?: Record<string, any>;
  error?: string;
}

export interface NodeHandler {
  canHandle: (nodeType: string) => boolean;
  execute: (
    node: WorkflowNode, 
    inputs: Record<string, any>, 
    context: WorkflowContext
  ) => Promise<Record<string, any>>;
}

export interface ExecutionOptions {
  variables?: Record<string, any>;
  startNodeId?: string;
  maxSteps?: number;
}

export interface WorkflowEngine {
  // Core execution methods
  executeWorkflow: (workflow: Workflow, chatId: string, options?: ExecutionOptions) => Promise<ExecutionResult>;
  continueExecution: (workflowId: string, chatId: string, options?: ExecutionOptions) => Promise<ExecutionResult>;
  pauseExecution: (workflowId: string, chatId: string) => Promise<boolean>;
  stopExecution: (workflowId: string, chatId: string) => Promise<boolean>;
  
  // State management
  getExecutionState: (workflowId: string, chatId: string) => ExecutionState | undefined;
  setExecutionVariable: (workflowId: string, chatId: string, name: string, value: any) => boolean;
  
  // Task integration
  addTaskToWorkflow: (workflowId: string, chatId: string, task: DecomposedTask) => boolean;
  getWorkflowTasks: (workflowId: string, chatId: string) => SubTask[];
  
  // Node handler registration
  registerNodeHandler: (handler: NodeHandler) => void;
  unregisterNodeHandler: (handlerType: string) => void;
} 