/**
 * Formats a provider name to a more readable format
 * E.g., "google" -> "Google", "sendgrid" -> "SendGrid"
 */
export function formatProviderName(provider: string): string {
  if (!provider) return '';
  
  // Special case for providers with specific capitalization
  if (provider.toLowerCase() === 'sendgrid') return 'SendGrid';
  if (provider.toLowerCase() === 'mongodb') return 'MongoDB';
  if (provider.toLowerCase() === 'postgresql') return 'PostgreSQL';
  
  // Default case: capitalize first letter
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Format as: "Jun 15, 2023 at 2:30 PM"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generates a unique ID for new workflow nodes or connections
 */
export function generateId(prefix: string = 'node'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Saves a workflow to local storage
 */
export function saveWorkflowToLocalStorage(workflow: any): void {
  try {
    // Get existing workflows
    const savedWorkflows = JSON.parse(localStorage.getItem('leadflow_workflows') || '[]');
    
    // Check if this workflow already exists
    const existingIndex = savedWorkflows.findIndex((w: any) => w.id === workflow.id);
    
    // Update the workflow with the current timestamp
    const updatedWorkflow = {
      ...workflow,
      updatedAt: new Date().toISOString()
    };
    
    // Replace existing or add new
    if (existingIndex >= 0) {
      savedWorkflows[existingIndex] = updatedWorkflow;
    } else {
      // For new workflows, add createdAt
      if (!updatedWorkflow.createdAt) {
        updatedWorkflow.createdAt = updatedWorkflow.updatedAt;
      }
      savedWorkflows.push(updatedWorkflow);
    }
    
    // Save back to localStorage
    localStorage.setItem('leadflow_workflows', JSON.stringify(savedWorkflows));
    
  } catch (error) {
    console.error('Error saving workflow to localStorage:', error);
  }
}

/**
 * Loads workflows from local storage
 */
export function getWorkflowsFromLocalStorage(): any[] {
  try {
    const savedWorkflows = JSON.parse(localStorage.getItem('leadflow_workflows') || '[]');
    return savedWorkflows;
  } catch (error) {
    console.error('Error loading workflows from localStorage:', error);
    return [];
  }
} 