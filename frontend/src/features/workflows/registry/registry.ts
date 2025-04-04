import { Workflow, WorkflowMetadata, WorkflowRegistry, WorkflowRegistryItem } from './types';
import { generateId } from '@/components/WorkflowUtils';

class WorkflowRegistryService implements WorkflowRegistry {
  workflows: Record<string, WorkflowRegistryItem> = {};

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Initialize the registry with data from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const savedWorkflows = JSON.parse(localStorage.getItem('anp-workflow-registry') || '{}');
      this.workflows = savedWorkflows;
    } catch (error) {
      console.error('Error loading workflows from localStorage:', error);
      this.workflows = {};
    }
  }

  /**
   * Save the current state to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('anp-workflow-registry', JSON.stringify(this.workflows));
    } catch (error) {
      console.error('Error saving workflows to localStorage:', error);
    }
  }

  /**
   * Get a workflow by its ID
   */
  getWorkflow(id: string): WorkflowRegistryItem | undefined {
    return this.workflows[id];
  }

  /**
   * Register a new workflow in the registry
   * @returns The ID of the registered workflow
   */
  registerWorkflow(workflow: Workflow): string {
    // Generate an ID if one doesn't exist
    const workflowId = workflow.id || generateId('workflow');
    
    // Ensure metadata is complete
    const now = new Date().toISOString();
    const updatedWorkflow: Workflow = {
      ...workflow,
      id: workflowId,
      createdAt: workflow.createdAt || now,
      updatedAt: now
    };
    
    // Add to registry
    this.workflows[workflowId] = {
      workflow: updatedWorkflow
    };
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    return workflowId;
  }

  /**
   * Update an existing workflow
   * @returns boolean indicating success
   */
  updateWorkflow(id: string, workflow: Workflow): boolean {
    if (!this.workflows[id]) {
      return false;
    }
    
    // Preserve creation date, update the modified date
    const now = new Date().toISOString();
    const existingWorkflow = this.workflows[id].workflow;
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: existingWorkflow.createdAt,
      updatedAt: now
    };
    
    // Update the registry
    this.workflows[id] = {
      ...this.workflows[id],
      workflow: updatedWorkflow
    };
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    return true;
  }

  /**
   * Remove a workflow from the registry
   * @returns boolean indicating success
   */
  removeWorkflow(id: string): boolean {
    if (!this.workflows[id]) {
      return false;
    }
    
    delete this.workflows[id];
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    return true;
  }

  /**
   * List workflows with optional filtering
   */
  listWorkflows(filters?: Partial<WorkflowMetadata>): WorkflowRegistryItem[] {
    const workflowItems = Object.values(this.workflows);
    
    if (!filters) {
      return workflowItems;
    }
    
    // Filter workflows based on metadata
    return workflowItems.filter(item => {
      const workflow = item.workflow;
      
      // Check each filter property
      for (const [key, value] of Object.entries(filters)) {
        // Special handling for arrays (domains, capabilities, tags)
        if (Array.isArray(workflow[key as keyof WorkflowMetadata]) && Array.isArray(value)) {
          // Check if any of the filter values are in the workflow array
          const workflowArray = workflow[key as keyof WorkflowMetadata] as unknown as any[];
          const filterArray = value as any[];
          
          if (!filterArray.some(v => workflowArray.includes(v))) {
            return false;
          }
        } 
        // String comparison for other properties
        else if (workflow[key as keyof WorkflowMetadata] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }
}

// Create a singleton instance
export const workflowRegistry = new WorkflowRegistryService();

// Export a hook to access the registry
export function useWorkflowRegistry(): WorkflowRegistry {
  return workflowRegistry;
} 