import { TaskSubtask, TaskRoutingResult, updateSubtask, getNextExecutableSubtask } from './taskRouterService';

/**
 * Executes a subtask by delegating to the appropriate agent
 */
export async function executeSubtask(
  task: TaskRoutingResult, 
  subtask: TaskSubtask
): Promise<TaskRoutingResult> {
  try {
    console.log(`Executing subtask ${subtask.id} of type ${subtask.agentType}: ${subtask.description}`);
    
    // Update subtask status to in-progress
    let updatedTask = updateSubtask(task, subtask.id, { status: 'in-progress' });
    
    // Execute the subtask based on agent type
    try {
      let result: string;
      
      switch (subtask.agentType) {
        case 'research':
          result = await executeResearchTask(subtask);
          break;
        case 'email-outreach':
          result = await executeEmailTask(subtask);
          break;
        case 'meeting-scheduler':
          result = await executeMeetingTask(subtask);
          break;
        case 'data-analyzer':
          result = await executeDataAnalysisTask(subtask);
          break;
        case 'lead-qualifier':
          result = await executeLeadQualifierTask(subtask);
          break;
        default:
          throw new Error(`Unknown agent type: ${subtask.agentType}`);
      }
      
      // Update subtask with successful result
      updatedTask = updateSubtask(updatedTask, subtask.id, { 
        status: 'completed',
        result
      });
      
    } catch (error) {
      console.error(`Error executing subtask ${subtask.id}:`, error);
      
      // Update subtask with error
      updatedTask = updateSubtask(updatedTask, subtask.id, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
    
    return updatedTask;
  } catch (error) {
    console.error(`Error in executeSubtask for ${subtask.id}:`, error);
    throw error;
  }
}

/**
 * Executes a research task using the Research Agent
 */
async function executeResearchTask(subtask: TaskSubtask): Promise<string> {
  try {
    // Extract parameters from the subtask description
    const query = subtask.description;
    
    // Use dynamic import to get the executeAgentQuery function
    const { executeAgentQuery } = await import('./taskRouterService');
    
    // Call the agent through the generic interface
    const result = await executeAgentQuery('research-agent', query);
    
    if (!result.success) {
      throw new Error(result.error || 'Research query was not successful');
    }
    
    return result.response || 'No response from research agent';
  } catch (error) {
    console.error('Error in executeResearchTask:', error);
    throw error;
  }
}

/**
 * Executes an email task using the Email Outreach Agent
 */
async function executeEmailTask(subtask: TaskSubtask): Promise<string> {
  try {
    // TODO: Implement actual email outreach agent integration
    // For now, return a mock result
    return `Email task completed: ${subtask.description}`;
  } catch (error) {
    console.error('Error in executeEmailTask:', error);
    throw error;
  }
}

/**
 * Executes a meeting scheduling task
 */
async function executeMeetingTask(subtask: TaskSubtask): Promise<string> {
  try {
    // TODO: Implement actual meeting scheduler agent integration
    // For now, return a mock result
    return `Meeting scheduled: ${subtask.description}`;
  } catch (error) {
    console.error('Error in executeMeetingTask:', error);
    throw error;
  }
}

/**
 * Executes a data analysis task
 */
async function executeDataAnalysisTask(subtask: TaskSubtask): Promise<string> {
  try {
    // TODO: Implement actual data analyzer agent integration
    // For now, return a mock result
    return `Data analysis completed: ${subtask.description}`;
  } catch (error) {
    console.error('Error in executeDataAnalysisTask:', error);
    throw error;
  }
}

/**
 * Executes a lead qualifier task
 */
async function executeLeadQualifierTask(subtask: TaskSubtask): Promise<string> {
  try {
    // TODO: Implement actual lead qualifier agent integration
    // For now, return a mock result
    return `Lead qualification completed: ${subtask.description}`;
  } catch (error) {
    console.error('Error in executeLeadQualifierTask:', error);
    throw error;
  }
}

/**
 * Processes a task by executing all subtasks in the correct order
 */
export async function processTask(task: TaskRoutingResult): Promise<TaskRoutingResult> {
  try {
    console.log(`Processing task ${task.taskId} with ${task.subtasks.length} subtasks`);
    
    let currentTask = { ...task };
    let stuckCounter = 0; // To track potential deadlocks
    const maxWaitCycles = 5; // Maximum number of wait cycles before forcing execution
    
    // Keep processing until all subtasks are completed or failed
    while (currentTask.subtasks.some(st => st.status === 'not-started' || st.status === 'in-progress')) {
      // Find the next subtask to execute
      const nextSubtask = getNextExecutableSubtask(currentTask);
      
      if (!nextSubtask) {
        // No executable subtasks, but not all are complete
        const pendingTasks = currentTask.subtasks.filter(st => st.status === 'not-started');
        const inProgressTasks = currentTask.subtasks.filter(st => st.status === 'in-progress');
        
        if (inProgressTasks.length > 0) {
          // Some tasks are still in progress, wait a bit and check again
          console.log(`Waiting for ${inProgressTasks.length} in-progress tasks to complete`);
          stuckCounter = 0; // Reset the stuck counter as we're just waiting for in-progress tasks
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        if (pendingTasks.length > 0) {
          // There are pending tasks but none can be executed, might be a dependency issue
          console.warn(`Potential dependency issue detected: ${pendingTasks.length} tasks pending but none executable`);
          stuckCounter++;
          
          if (stuckCounter >= maxWaitCycles) {
            console.warn(`Stuck for ${maxWaitCycles} cycles, choosing first pending task to force execution`);
            
            // Force execution of the simplest pending task (one with fewest dependencies)
            const sortedPendingTasks = [...pendingTasks].sort((a, b) => 
              (a.dependsOn?.length || 0) - (b.dependsOn?.length || 0)
            );
            
            // Log the dependency chain for debugging
            const firstTask = sortedPendingTasks[0];
            console.log(`Forcing execution of task ${firstTask.id}: ${firstTask.description}`);
            console.log(`Dependencies: ${firstTask.dependsOn?.join(', ') || 'none'}`);
            
            // Execute the task with the fewest dependencies
            currentTask = await executeSubtask(currentTask, firstTask);
            stuckCounter = 0; // Reset counter after forcing execution
            continue;
          }
          
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      } else {
        // A subtask is ready to execute
        stuckCounter = 0; // Reset stuck counter
        console.log(`Executing subtask ${nextSubtask.id}: ${nextSubtask.description}`);
        currentTask = await executeSubtask(currentTask, nextSubtask);
      }
    }
    
    // Final check for completion status
    const completedTasks = currentTask.subtasks.filter(st => st.status === 'completed').length;
    const failedTasks = currentTask.subtasks.filter(st => st.status === 'failed').length;
    
    console.log(`Task ${currentTask.taskId} processing complete. Completed: ${completedTasks}, Failed: ${failedTasks}`);
    
    // Update the task status if there were failures
    if (failedTasks > 0 && completedTasks === 0) {
      currentTask.status = 'failed';
      currentTask.error = 'All subtasks failed to complete';
    } else if (failedTasks > 0) {
      console.log(`Task completed with ${failedTasks} failed subtasks`);
    }
    
    return currentTask;
  } catch (error) {
    console.error(`Error processing task ${task.taskId}:`, error);
    throw error;
  }
} 