import { generateId } from '@/components/WorkflowUtils';
import { workflowRegistry } from '../registry/registry';
import { WorkflowContext } from '../registry/types';
import { 
  DecomposedTask, 
  IntentPattern, 
  SubTask, 
  TaskIntent, 
  TaskRouter, 
  TaskRouterConfig, 
  TaskRouterOptions 
} from './types';

// Mock LLM call for intent recognition (in a real app, this would call an API)
async function mockLLMIntentRecognition(
  query: string, 
  intents: IntentPattern[], 
  workflowContext?: WorkflowContext
): Promise<TaskIntent> {
  // This would be replaced with a real LLM call
  console.log('Recognizing intent for query:', query);
  console.log('Available intents:', intents);
  console.log('Workflow context:', workflowContext);
  
  // For demo purposes, use simple keyword matching
  let bestMatch: IntentPattern | null = null;
  let highestScore = 0;
  
  for (const intent of intents) {
    // Simple keyword matching
    let score = 0;
    
    if (typeof intent.pattern === 'string') {
      // String matching
      if (query.toLowerCase().includes(intent.pattern.toLowerCase())) {
        score = 0.8;
      }
    } else {
      // RegExp matching
      if (intent.pattern.test(query)) {
        score = 0.9;
      }
    }
    
    // Check for exact matches in examples
    for (const example of intent.examples) {
      if (query.toLowerCase() === example.toLowerCase()) {
        score = 1.0;
        break;
      }
    }
    
    // Consider priority
    score *= (1 + intent.priority * 0.1);
    
    // If workflow-specific intent matches current workflow context, boost score
    if (workflowContext && intent.workflowId === workflowContext.workflowId) {
      score *= 1.5;
    }
    
    // Ensure general_query always has a minimum score as a fallback
    if (intent.id === 'general_query' && score < 0.3) {
      score = 0.3; // Minimum baseline score
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = intent;
    }
  }
  
  if (bestMatch && highestScore > 0.3) {
    return {
      id: bestMatch.id,
      name: bestMatch.id,
      description: `Recognized intent: ${bestMatch.id}`,
      confidence: highestScore,
    };
  }
  
  // Default fallback intent
  return {
    id: 'general_query',
    name: 'General Query',
    description: 'General query without specific recognized intent',
    confidence: 0.3,
  };
}

// Mock LLM call for task decomposition (in a real app, this would call an API)
async function mockLLMTaskDecomposition(
  query: string, 
  intent: TaskIntent, 
  workflowContext?: WorkflowContext
): Promise<SubTask[]> {
  // This would be replaced with a real LLM call
  console.log('Decomposing task for query:', query);
  console.log('Recognized intent:', intent);
  console.log('Workflow context:', workflowContext);
  
  // For demo purposes, generate 2-3 subtasks
  const subtaskCount = Math.floor(Math.random() * 2) + 2;
  const now = new Date();
  
  const subtasks: SubTask[] = [];
  
  // If this is a general query, assign it to the general purpose agent
  if (intent.id === 'general_query') {
    subtasks.push({
      id: generateId('subtask'),
      description: `Answer general query: ${query}`,
      status: 'pending',
      agentId: 'general_purpose', // Use the general purpose agent
      confidence: 0.8,
      createdAt: now,
      updatedAt: now,
    });
    
    return subtasks;
  }
  
  // For other intents, create multiple subtasks with different agents
  for (let i = 0; i < subtaskCount; i++) {
    subtasks.push({
      id: generateId('subtask'),
      description: `Subtask ${i + 1} for ${intent.name}`,
      status: 'pending',
      agentId: `agent_${i % 3 + 1}`, // Assign to different mock agents
      confidence: 0.7 + (Math.random() * 0.3),
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return subtasks;
}

class TaskRouterService implements TaskRouter {
  private registeredIntents: IntentPattern[] = [];
  private config: TaskRouterConfig = {
    intentRecognitionThreshold: 0.5,
    maxSubtasks: 5,
    defaultAgentId: 'general_agent'
  };
  
  constructor() {
    // Register some default intents
    this.registerDefaultIntents();
  }
  
  private registerDefaultIntents(): void {
    this.registerIntent({
      id: 'research_intent',
      pattern: /(research|find information|learn about|gather data on)/i,
      examples: [
        'Research the market trends for electric vehicles',
        'Find information about climate change impacts',
        'I need to learn about quantum computing'
      ],
      priority: 1
    });
    
    this.registerIntent({
      id: 'lead_generation_intent',
      pattern: /(find leads|generate leads|identify prospects|potential customers)/i,
      examples: [
        'Find leads for software companies in California',
        'Generate a list of potential customers',
        'Identify prospects in the healthcare industry'
      ],
      priority: 1
    });
    
    this.registerIntent({
      id: 'content_creation_intent',
      pattern: /(create content|write|draft|compose)/i,
      examples: [
        'Create content for my social media',
        'Write a blog post about AI trends',
        'Draft an email for my newsletter',
        'Compose a product description'
      ],
      priority: 1
    });
    
    // Add general query intent for questions and general information requests
    this.registerIntent({
      id: 'general_query',
      pattern: /(what|how|why|who|when|where|can you|tell me|explain|define|help)/i,
      examples: [
        'What is machine learning?',
        'How does solar energy work?',
        'Tell me about climate change',
        'Can you help me understand blockchain?',
        'Explain the theory of relativity'
      ],
      priority: 0.5 // Lower priority so specialized intents take precedence
    });
  }
  
  /**
   * Route a user query through the task router
   */
  async routeTask(query: string, options?: TaskRouterOptions): Promise<DecomposedTask> {
    const workflowContext = options?.workflowContext;
    const routerConfig = { ...this.config, ...(options?.config || {}) };
    
    // Step 1: Recognize intent using LLM
    const intent = await mockLLMIntentRecognition(
      query, 
      this.registeredIntents, 
      workflowContext
    );
    
    // Check if intent recognition meets threshold
    if (intent.confidence < routerConfig.intentRecognitionThreshold) {
      // Fall back to general query handling
      intent.id = 'general_query';
      intent.name = 'General Query';
      intent.description = 'Handling as a general query due to low intent confidence';
    }
    
    // Step 2: Decompose task into subtasks
    const subtasks = await mockLLMTaskDecomposition(
      query, 
      intent, 
      workflowContext
    );
    
    // Limit number of subtasks based on config
    const limitedSubtasks = subtasks.slice(0, routerConfig.maxSubtasks);
    
    // Step 3: Build the decomposed task
    const decomposedTask: DecomposedTask = {
      originalQuery: query,
      mainIntent: intent,
      subtasks: limitedSubtasks,
      context: {
        workflowId: workflowContext?.workflowId,
        timestamp: new Date().toISOString()
      }
    };
    
    return decomposedTask;
  }
  
  /**
   * Execute a decomposed task (in a real implementation, this would dispatch to agents)
   */
  async executeTask(task: DecomposedTask): Promise<any> {
    console.log('Executing task:', task);
    
    // Mock execution - in a real app, this would dispatch tasks to agents
    const results = [];
    
    for (const subtask of task.subtasks) {
      // Update status to in progress
      subtask.status = 'in_progress';
      subtask.startedAt = new Date();
      subtask.updatedAt = new Date();
      
      // In a real app, this would call the agent system
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock result
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        subtask.status = 'completed';
        subtask.result = `Result for ${subtask.description}`;
      } else {
        subtask.status = 'failed';
        subtask.error = 'Mock error occurred during task execution';
      }
      
      subtask.completedAt = new Date();
      subtask.updatedAt = new Date();
      
      results.push({
        subtaskId: subtask.id,
        success,
        result: subtask.result || subtask.error
      });
    }
    
    return {
      taskId: task.mainIntent.id,
      results
    };
  }
  
  /**
   * Register a new intent pattern
   */
  registerIntent(intent: IntentPattern): void {
    // Check if intent with this ID already exists
    const existingIndex = this.registeredIntents.findIndex(i => i.id === intent.id);
    
    if (existingIndex >= 0) {
      // Update existing intent
      this.registeredIntents[existingIndex] = intent;
    } else {
      // Add new intent
      this.registeredIntents.push(intent);
    }
    
    // Sort intents by priority (higher numbers first)
    this.registeredIntents.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Unregister an intent pattern
   */
  unregisterIntent(intentId: string): void {
    this.registeredIntents = this.registeredIntents.filter(i => i.id !== intentId);
  }
  
  /**
   * Get all registered intent patterns
   */
  getRegisteredIntents(): IntentPattern[] {
    return [...this.registeredIntents];
  }
  
  /**
   * Update router configuration
   */
  setConfig(config: Partial<TaskRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current router configuration
   */
  getConfig(): TaskRouterConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const taskRouter = new TaskRouterService();

// Export hook for accessing task router
export function useTaskRouter(): TaskRouter {
  return taskRouter;
} 