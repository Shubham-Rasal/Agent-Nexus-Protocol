import { generateId } from '@/components/WorkflowUtils';
import { Workflow, WorkflowContext, WorkflowNode } from '../registry/types';
import { workflowRegistry } from '../registry/registry';
import { DecomposedTask, SubTask } from '../router/types';
import { 
  ExecutionOptions, 
  ExecutionResult, 
  ExecutionState, 
  ExecutionStatus, 
  NodeExecutionState, 
  NodeHandler, 
  WorkflowEngine 
} from './types';

// Helper functions
function findStartNode(workflow: Workflow): WorkflowNode | undefined {
  // First try to find a trigger node
  const triggerNode = workflow.nodes.find(node => node.type === 'trigger');
  if (triggerNode) return triggerNode;
  
  // If no trigger node, look for a node with no incoming edges
  const nodesWithIncomingEdges = new Set(
    workflow.edges.map(edge => edge.target)
  );
  
  return workflow.nodes.find(node => !nodesWithIncomingEdges.has(node.id));
}

function findNextNodes(workflow: Workflow, currentNodeId: string): WorkflowNode[] {
  // Find all edges coming from this node
  const outgoingEdges = workflow.edges.filter(edge => edge.source === currentNodeId);
  
  // Find the target nodes
  return outgoingEdges
    .map(edge => workflow.nodes.find(node => node.id === edge.target))
    .filter((node): node is WorkflowNode => node !== undefined);
}

class WorkflowEngineService implements WorkflowEngine {
  private nodeHandlers: NodeHandler[] = [];
  private executionStates: Record<string, Record<string, ExecutionState>> = {};
  
  constructor() {
    this.loadFromLocalStorage();
    this.registerDefaultNodeHandlers();
  }
  
  private getStateKey(workflowId: string, chatId: string): string {
    return `${workflowId}:${chatId}`;
  }
  
  private loadFromLocalStorage(): void {
    try {
      const savedStates = JSON.parse(localStorage.getItem('anp-workflow-states') || '{}');
      
      // Convert string dates back to Date objects
      Object.keys(savedStates).forEach(workflowId => {
        Object.keys(savedStates[workflowId]).forEach(chatId => {
          const state = savedStates[workflowId][chatId];
          
          if (state.startTime) state.startTime = new Date(state.startTime);
          if (state.endTime) state.endTime = new Date(state.endTime);
          
          state.history.forEach((item: any) => {
            item.timestamp = new Date(item.timestamp);
          });
          
          Object.values(state.nodeStates).forEach((nodeState: any) => {
            if (nodeState.startTime) nodeState.startTime = new Date(nodeState.startTime);
            if (nodeState.endTime) nodeState.endTime = new Date(nodeState.endTime);
          });
        });
      });
      
      this.executionStates = savedStates;
    } catch (error) {
      console.error('Error loading workflow states from localStorage:', error);
      this.executionStates = {};
    }
  }
  
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('anp-workflow-states', JSON.stringify(this.executionStates));
    } catch (error) {
      console.error('Error saving workflow states to localStorage:', error);
    }
  }
  
  private registerDefaultNodeHandlers(): void {
    // Trigger node handler
    this.registerNodeHandler({
      canHandle: (nodeType) => nodeType === 'trigger',
      execute: async (node, inputs, context) => {
        console.log('Executing trigger node:', node.id);
        // Triggers just pass through their inputs
        return { ...inputs, triggered: true };
      }
    });
    
    // Action node handler
    this.registerNodeHandler({
      canHandle: (nodeType) => nodeType === 'action',
      execute: async (node, inputs, context) => {
        console.log('Executing action node:', node.id);
        // In a real implementation, this would perform the actual action
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { 
          ...inputs, 
          actionPerformed: true,
          actionName: node.data.label,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    // Condition node handler
    this.registerNodeHandler({
      canHandle: (nodeType) => nodeType === 'condition',
      execute: async (node, inputs, context) => {
        console.log('Executing condition node:', node.id);
        // In a real implementation, this would evaluate the condition
        const condition = node.data.config?.condition;
        const result = Math.random() > 0.5; // Random decision for demo
        
        return { 
          ...inputs, 
          conditionResult: result,
          conditionName: node.data.label,
          path: result ? 'true' : 'false' 
        };
      }
    });
    
    // Agent node handler
    this.registerNodeHandler({
      canHandle: (nodeType) => nodeType === 'agent',
      execute: async (node, inputs, context) => {
        console.log('Executing agent node:', node.id);
        // In a real implementation, this would call the agent
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const agentId = node.data.config?.agentId || 'default_agent';
        return { 
          ...inputs, 
          agentResult: `Result from agent ${agentId}`,
          agentName: node.data.label,
          completed: true
        };
      }
    });
  }
  
  async executeWorkflow(workflow: Workflow, chatId: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const workflowId = workflow.id;
    
    // Initialize execution state
    const executionState: ExecutionState = {
      workflowId,
      chatId,
      status: ExecutionStatus.RUNNING,
      nodeStates: {},
      variables: options?.variables || {},
      history: [],
      tasks: [],
      startTime: new Date()
    };
    
    // Find the starting node
    const startNodeId = options?.startNodeId;
    const startNode = startNodeId 
      ? workflow.nodes.find(node => node.id === startNodeId) 
      : findStartNode(workflow);
    
    if (!startNode) {
      executionState.status = ExecutionStatus.ERROR;
      executionState.error = 'No start node found in workflow';
      this.saveExecutionState(workflowId, chatId, executionState);
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: 'No start node found in workflow'
      };
    }
    
    executionState.currentNodeId = startNode.id;
    this.saveExecutionState(workflowId, chatId, executionState);
    
    // Execute the workflow starting from the start node
    return this.executeNode(workflow, startNode, {}, executionState, options);
  }
  
  async continueExecution(workflowId: string, chatId: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const stateKey = this.getStateKey(workflowId, chatId);
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: 'No execution state found for the specified workflow and chat'
      };
    }
    
    // Can only continue from paused state
    if (executionState.status !== ExecutionStatus.PAUSED) {
      return {
        success: false,
        status: executionState.status,
        error: `Cannot continue workflow from ${executionState.status} state`
      };
    }
    
    // Get the workflow
    const registryItem = workflowRegistry.getWorkflow(workflowId);
    if (!registryItem) {
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: 'Workflow not found in registry'
      };
    }
    
    const workflow = registryItem.workflow;
    
    // Find the current node
    const currentNodeId = options?.startNodeId || executionState.currentNodeId;
    if (!currentNodeId) {
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: 'No current node to continue from'
      };
    }
    
    const currentNode = workflow.nodes.find(node => node.id === currentNodeId);
    if (!currentNode) {
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: 'Current node not found in workflow'
      };
    }
    
    // Update execution state
    executionState.status = ExecutionStatus.RUNNING;
    this.saveExecutionState(workflowId, chatId, executionState);
    
    // Continue execution from the current node
    return this.executeNode(
      workflow, 
      currentNode, 
      executionState.variables, 
      executionState, 
      options
    );
  }
  
  async pauseExecution(workflowId: string, chatId: string): Promise<boolean> {
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      return false;
    }
    
    // Can only pause from running state
    if (executionState.status !== ExecutionStatus.RUNNING) {
      return false;
    }
    
    // Update state
    executionState.status = ExecutionStatus.PAUSED;
    
    // Add to history
    executionState.history.push({
      nodeId: executionState.currentNodeId || 'unknown',
      action: 'pause',
      timestamp: new Date(),
      data: { reason: 'User requested pause' }
    });
    
    this.saveExecutionState(workflowId, chatId, executionState);
    return true;
  }
  
  async stopExecution(workflowId: string, chatId: string): Promise<boolean> {
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      return false;
    }
    
    // Can stop from any state except completed or error
    if (executionState.status === ExecutionStatus.COMPLETED || 
        executionState.status === ExecutionStatus.ERROR) {
      return false;
    }
    
    // Update state
    executionState.status = ExecutionStatus.COMPLETED;
    executionState.endTime = new Date();
    
    // Add to history
    executionState.history.push({
      nodeId: executionState.currentNodeId || 'unknown',
      action: 'stop',
      timestamp: new Date(),
      data: { reason: 'User requested stop' }
    });
    
    this.saveExecutionState(workflowId, chatId, executionState);
    return true;
  }
  
  getExecutionState(workflowId: string, chatId: string): ExecutionState | undefined {
    if (!this.executionStates[workflowId]) {
      return undefined;
    }
    
    return this.executionStates[workflowId][chatId];
  }
  
  setExecutionVariable(workflowId: string, chatId: string, name: string, value: any): boolean {
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      return false;
    }
    
    executionState.variables[name] = value;
    this.saveExecutionState(workflowId, chatId, executionState);
    
    return true;
  }
  
  addTaskToWorkflow(workflowId: string, chatId: string, task: DecomposedTask): boolean {
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      // Create a new execution state if one doesn't exist
      const newState: ExecutionState = {
        workflowId,
        chatId,
        status: ExecutionStatus.IDLE,
        nodeStates: {},
        variables: {},
        history: [],
        tasks: [task]
      };
      
      this.saveExecutionState(workflowId, chatId, newState);
      return true;
    }
    
    // Add task to existing state
    executionState.tasks.push(task);
    this.saveExecutionState(workflowId, chatId, executionState);
    
    return true;
  }
  
  getWorkflowTasks(workflowId: string, chatId: string): SubTask[] {
    const executionState = this.getExecutionState(workflowId, chatId);
    
    if (!executionState) {
      return [];
    }
    
    // Flatten all subtasks from all decomposed tasks
    return executionState.tasks.flatMap(task => task.subtasks);
  }
  
  registerNodeHandler(handler: NodeHandler): void {
    this.nodeHandlers.push(handler);
  }
  
  unregisterNodeHandler(handlerType: string): void {
    this.nodeHandlers = this.nodeHandlers.filter(
      handler => !handler.canHandle(handlerType)
    );
  }
  
  private saveExecutionState(workflowId: string, chatId: string, state: ExecutionState): void {
    if (!this.executionStates[workflowId]) {
      this.executionStates[workflowId] = {};
    }
    
    this.executionStates[workflowId][chatId] = state;
    this.saveToLocalStorage();
  }
  
  private async executeNode(
    workflow: Workflow, 
    node: WorkflowNode, 
    inputs: Record<string, any>, 
    state: ExecutionState,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const { workflowId, chatId } = state;
    const nodeId = node.id;
    
    // Initialize node state if it doesn't exist
    if (!state.nodeStates[nodeId]) {
      state.nodeStates[nodeId] = {
        nodeId,
        status: ExecutionStatus.IDLE,
      };
    }
    
    // Update node state to running
    const nodeState = state.nodeStates[nodeId];
    nodeState.status = ExecutionStatus.RUNNING;
    nodeState.startTime = new Date();
    nodeState.inputs = inputs;
    
    // Update current node in execution state
    state.currentNodeId = nodeId;
    
    // Add to history
    state.history.push({
      nodeId,
      action: 'start',
      timestamp: new Date(),
      data: { inputs }
    });
    
    // Save state
    this.saveExecutionState(workflowId, chatId, state);
    
    try {
      // Find a handler for this node type
      const handler = this.nodeHandlers.find(h => h.canHandle(node.type));
      
      if (!handler) {
        throw new Error(`No handler found for node type: ${node.type}`);
      }
      
      // Create an execution context (for use by node handlers)
      const context: WorkflowContext = {
        workflowId,
        chatId,
        variables: [],
        status: 'running',
        progress: 0
      };
      
      // Execute the node
      const outputs = await handler.execute(node, inputs, context);
      
      // Update node state with outputs
      nodeState.status = ExecutionStatus.COMPLETED;
      nodeState.endTime = new Date();
      nodeState.outputs = outputs;
      
      // Add to history
      state.history.push({
        nodeId,
        action: 'complete',
        timestamp: new Date(),
        data: { outputs }
      });
      
      // Update variables with outputs
      state.variables = { ...state.variables, ...outputs };
      
      // Save state
      this.saveExecutionState(workflowId, chatId, state);
      
      // Find next nodes
      const nextNodes = findNextNodes(workflow, nodeId);
      
      // If there are no next nodes, the workflow is completed
      if (nextNodes.length === 0) {
        state.status = ExecutionStatus.COMPLETED;
        state.endTime = new Date();
        this.saveExecutionState(workflowId, chatId, state);
        
        return {
          success: true,
          status: ExecutionStatus.COMPLETED,
          outputs: state.variables
        };
      }
      
      // For conditions, choose the path based on the condition result
      if (node.type === 'condition') {
        const path = outputs.path || (outputs.conditionResult ? 'true' : 'false');
        
        // Find the edge with the matching label
        const matchingEdge = workflow.edges.find(
          edge => edge.source === nodeId && (
            // Match by edge label if it exists
            (edge.label && 
             (edge.label.toLowerCase() === path.toLowerCase() || 
              (path === 'true' && edge.label.toLowerCase() === 'yes') ||
              (path === 'false' && edge.label.toLowerCase() === 'no')
             )
            ) || 
            // If no matching label, take the first edge if condition is true
            (path === 'true' && !edge.label)
          )
        );
        
        if (matchingEdge) {
          const nextNode = workflow.nodes.find(n => n.id === matchingEdge.target);
          if (nextNode) {
            return this.executeNode(workflow, nextNode, state.variables, state, options);
          }
        }
        
        // If we couldn't find a matching edge, we're done
        state.status = ExecutionStatus.COMPLETED;
        state.endTime = new Date();
        this.saveExecutionState(workflowId, chatId, state);
        
        return {
          success: true,
          status: ExecutionStatus.COMPLETED,
          outputs: state.variables
        };
      }
      
      // For normal nodes, just execute the first next node
      if (nextNodes.length > 0) {
        return this.executeNode(workflow, nextNodes[0], state.variables, state, options);
      }
      
      // If we get here, the workflow is completed
      state.status = ExecutionStatus.COMPLETED;
      state.endTime = new Date();
      this.saveExecutionState(workflowId, chatId, state);
      
      return {
        success: true,
        status: ExecutionStatus.COMPLETED,
        outputs: state.variables
      };
      
    } catch (error: any) {
      // Update node state with error
      nodeState.status = ExecutionStatus.ERROR;
      nodeState.endTime = new Date();
      nodeState.error = error.message;
      
      // Update execution state
      state.status = ExecutionStatus.ERROR;
      state.endTime = new Date();
      state.error = `Error in node ${nodeId}: ${error.message}`;
      
      // Add to history
      state.history.push({
        nodeId,
        action: 'error',
        timestamp: new Date(),
        data: { error: error.message }
      });
      
      // Save state
      this.saveExecutionState(workflowId, chatId, state);
      
      return {
        success: false,
        status: ExecutionStatus.ERROR,
        error: error.message
      };
    }
  }
}

// Create singleton instance
export const workflowEngine = new WorkflowEngineService();

// Export hook for accessing workflow engine
export function useWorkflowEngine(): WorkflowEngine {
  return workflowEngine;
} 