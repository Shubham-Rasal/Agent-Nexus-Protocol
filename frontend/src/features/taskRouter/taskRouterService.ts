import { PRESET_AGENTS } from '../agents/presets';

// For TypeScript type support
interface LLMResponse {
  message: {
    content: string;
    role: string;
  };
}

interface ParsedSubtask {
  description: string;
  agentType: string;
  dependsOn: (string | number)[];
}

export interface TaskSubtask {
  id: string;
  description: string;
  agentType: 'research' | 'email-outreach' | 'meeting-scheduler' | 'data-analyzer' | 'lead-qualifier' | 'summary' | 'analysis' | 'explanation' | 'comparison' | 'recommendation' | 'planning' | 'compilation';
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
  dependsOn?: string[]; // IDs of tasks that must be completed before this one
}

export interface TaskRoutingResult {
  taskId: string;
  originalQuery: string;
  analysis: string;
  subtasks: TaskSubtask[];
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  finalResult?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskExecutionResult {
  success: boolean;
  originalQuery: string;
  result: string | null;
  error: string | null;
  subtasks: TaskSubtask[];
}

export interface SubtaskExecutionResult {
  success: boolean;
  result: string | null;
  error: string | null;
}

/**
 * Main function to analyze a query and determine what agents should handle it
 */
export async function analyzeQuery(query: string): Promise<TaskRoutingResult> {
  console.log(`Analyzing query: "${query}"`);
  
  // Generate a unique task ID
  const taskId = generateTaskId();
  
  try {
    // Use LLM-based analysis for query breakdown
    const { analysis, subtasks } = await analyzeQueryWithLLM(query, taskId);
    
    // Construct the task object with the LLM-generated analysis and subtasks
    const task: TaskRoutingResult = {
      taskId,
      originalQuery: query,
      analysis,
      subtasks,
      status: "planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return task;
  } catch (error) {
    console.error("Error analyzing query with LLM:", error);
    
    // Fallback to keyword-based analysis
    console.log("Falling back to keyword-based analysis");
    return analyzeQueryWithKeywords(query, taskId);
  }
}

/**
 * Use LLM to analyze a query and determine required subtasks, using Lilypad API
 */
async function analyzeQueryWithLLM(query: string, taskId: string): Promise<{
  analysis: string;
  subtasks: TaskSubtask[];
}> {
  // Get all available agent types
  const availableAgentTypes = PRESET_AGENTS.map(agent => agent.id);
  
  // Construct the system prompt for the LLM
  const systemPrompt = `You are a task routing expert. Your job is to break down complex queries into subtasks that can be assigned to specialized agents.
Available agent types: ${availableAgentTypes.join(', ')}
Available internal task types: summary, analysis, explanation, comparison, recommendation, planning, compilation

Rules:
1. Break down the query into logical, sequential subtasks
2. Assign each subtask to an appropriate agent or internal task
3. Consider dependencies - some tasks may require results from previous tasks
4. For research or information gathering, always use the 'research-agent'
5. Keep your analysis concise but thorough
6. Research should generally come before analysis or summary
7. Compilation should be the final step if multiple subtasks are created

Format your response as a JSON object with these fields:
- analysis: a brief explanation of your approach
- subtasks: an array of subtasks, each with:
  - description: clear description of the subtask
  - agentType: the agent or task type to handle this subtask
  - dependsOn: an array of subtask numbers that must complete first (empty array for independent tasks)`;

  // User message simply contains the query
  const userPrompt = `Break down this query into subtasks: "${query}"`;

  // Call the LLM to analyze the query
  try {
    // Ensure we have the API key
    const apiKey = process.env.LILYPAD_API_KEY || process.env.NEXT_PUBLIC_LILYPAD_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Lilypad API key in environment variables");
    }

    // Prepare the API request to Lilypad
    const myHeaders = new Headers();
    myHeaders.append("authorization", `Bearer ${apiKey}`);
    myHeaders.append("content-type", "application/json");

    const payload = JSON.stringify({
      "model": "deepseek-r1:7b",
      "messages": [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": userPrompt }
      ],
      "stream": false
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: payload
    };

    // Call the Lilypad LLM API
    console.log("Calling Lilypad API for task analysis...");
    const response = await fetch("https://anura-testnet.lilypad.tech/api/v1/chat/completions", requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}, ${await response.text()}`);
    }

    const result = await response.json();
    
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error("Invalid response structure from Lilypad API");
    }
    
    const content = result.choices[0].message.content;
    let parsedResponse: { analysis: string; subtasks: ParsedSubtask[] };
    
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      console.log("Raw response:", content);
      
      // Try to extract with regex as a fallback
      const analysis = content.match(/analysis[:\s]*(.*?)(?=subtasks|\n\n|$)/i)?.[1]?.trim() || 
        "Breaking down the query into manageable subtasks";
        
      const subtasksMatch = content.match(/subtasks[:\s]*([\s\S]*?)(?=\n\n\w|$)/i);
      
      if (!subtasksMatch) {
        throw new Error("Could not extract subtasks from LLM response");
      }
      
      // Manually parse subtasks if JSON parsing failed
      const subtaskLines = subtasksMatch[1].split(/\d+\.\s+/);
      const extractedSubtasks: ParsedSubtask[] = [];
      
      for (let i = 1; i < subtaskLines.length; i++) {
        const line = subtaskLines[i].trim();
        
        // Try to extract description and agent type
        const descMatch = line.match(/description[:\s]*(.*?)(?=agent|$)/i);
        const agentMatch = line.match(/agent(?:Type)?[:\s]*([\w-]+)/i);
        const depsMatch = line.match(/dependsOn[:\s]*\[(.*?)\]/i);
        
        if (descMatch && agentMatch) {
          const description = descMatch[1].trim().replace(/['"]/g, '');
          const agentType = agentMatch[1].trim().replace(/['"]/g, '');
          let dependsOn: (string | number)[] = [];
          
          // Parse dependencies if present
          if (depsMatch && depsMatch[1].trim()) {
            dependsOn = depsMatch[1].split(',')
              .map((dep: string) => parseInt(dep.trim()))
              .filter((num: number) => !isNaN(num))
              .map((num: number) => `${taskId}-subtask-${num}`);
          }
          
          extractedSubtasks.push({
            description,
            agentType,
            dependsOn
          });
        }
      }
      
      parsedResponse = {
        analysis,
        subtasks: extractedSubtasks
      };
    }
    
    // Validate the parsed response
    if (!parsedResponse || !parsedResponse.analysis || !Array.isArray(parsedResponse.subtasks)) {
      throw new Error("Invalid LLM response structure");
    }
    
    // Convert the parsed subtasks to the TaskSubtask format
    const subtasks: TaskSubtask[] = parsedResponse.subtasks.map((st: ParsedSubtask, index: number) => {
      // Convert dependencies if they're numbers (subtask indices) to actual IDs
      const dependsOn = Array.isArray(st.dependsOn) 
        ? st.dependsOn.map((dep: string | number) => {
            if (typeof dep === 'number') {
              return `${taskId}-subtask-${dep}`;
            }
            return dep;
          })
        : [];
        
      return {
        id: `${taskId}-subtask-${index + 1}`,
        description: st.description,
        agentType: st.agentType as any, // Cast to the required type
        status: "not-started" as const,
        dependsOn,
        result: "",
        error: ""
      };
    });
    
    // Validate agent types
    for (const subtask of subtasks) {
      // Check if the agent type is valid
      const isValidType = [
        'research', 'email-outreach', 'meeting-scheduler', 'data-analyzer', 'lead-qualifier',
        'summary', 'analysis', 'explanation', 'comparison', 'recommendation', 'planning', 'compilation'
      ].includes(subtask.agentType);
      
      if (!isValidType) {
        console.warn(`Invalid agent type "${subtask.agentType}" for subtask, defaulting to research`);
        subtask.agentType = 'research';
      }
    }
    
    console.log("Successfully parsed task analysis with Lilypad API");
    // Return the analysis and subtasks
    return {
      analysis: parsedResponse.analysis,
      subtasks: subtasks
    };
  } catch (error) {
    console.error("Error calling Lilypad API for query analysis:", error);
    throw error;
  }
}

/**
 * Fallback function that uses keyword-based approach to analyze query
 * This is the original implementation that works without LLM
 */
function analyzeQueryWithKeywords(query: string, taskId: string): TaskRoutingResult {
  console.log("Using keyword-based analysis for:", query);
  
  const task: TaskRoutingResult = {
    taskId,
    originalQuery: query,
    status: "planning",
    subtasks: [],
    analysis: "Breaking down the task into manageable subtasks",
  };
  
  // For this fallback implementation, we'll use simple rules
  // Define some example task patterns
  const patterns = [
    {
      keywords: ["research", "information", "find", "search", "look up", "learn about"],
      subtask: {
        id: `${taskId}-research`,
        description: "Search for relevant information online",
        agentType: "research" as const,
        status: "not-started" as const,
        dependsOn: [],
      }
    },
    {
      keywords: ["summarize", "summary", "brief", "overview"],
      subtask: {
        id: `${taskId}-summarize`,
        description: "Create a concise summary of the information",
        agentType: "summary" as const,
        status: "not-started" as const,
        dependsOn: [`${taskId}-research`], // This task depends on research being done first
        result: "",
        error: ""
      }
    },
    {
      keywords: ["analyze", "evaluation", "assessment", "review", "critique"],
      subtask: {
        id: `${taskId}-analyze`,
        description: "Perform analysis on the gathered information",
        agentType: "analysis" as const,
        status: "not-started" as const,
        dependsOn: [`${taskId}-research`], // This task depends on research being done first
        result: "",
        error: ""
      }
    },
    {
      keywords: ["explain", "clarify", "elaborate", "describe"],
      subtask: {
        id: `${taskId}-explain`,
        description: "Explain concepts in a clear and understandable way",
        agentType: "explanation" as const,
        status: "not-started" as const,
        dependsOn: [],
        result: "",
        error: ""
      }
    },
    {
      keywords: ["compare", "contrast", "difference", "similarity", "versus", "vs"],
      subtask: {
        id: `${taskId}-compare`,
        description: "Compare different aspects of the gathered information",
        agentType: "comparison" as const,
        status: "not-started" as const,
        dependsOn: [`${taskId}-research`], // This task depends on research being done first
        result: "",
        error: ""
      }
    },
    {
      keywords: ["recommend", "suggestion", "advise", "best", "top"],
      subtask: {
        id: `${taskId}-recommend`,
        description: "Offer recommendations based on the information",
        agentType: "recommendation" as const,
        status: "not-started" as const,
        dependsOn: [`${taskId}-research`, `${taskId}-analyze`], // Depends on both research and analysis
        result: "",
        error: ""
      }
    },
    {
      keywords: ["plan", "steps", "procedure", "how to", "process"],
      subtask: {
        id: `${taskId}-plan`,
        description: "Develop a step-by-step plan or procedure",
        agentType: "planning" as const,
        status: "not-started" as const,
        dependsOn: [`${taskId}-research`],
        result: "",
        error: ""
      }
    }
  ];
  
  // Original keyword matching logic
  let subtasksToAdd = [];
  // Check which patterns match the query
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      // Deep clone the subtask object to avoid reference issues
      const subtask = JSON.parse(JSON.stringify(pattern.subtask));
      subtasksToAdd.push(subtask);
    }
  }
  
  // If no specific patterns are matched, default to a general research task
  if (subtasksToAdd.length === 0) {
    subtasksToAdd.push({
      id: `${taskId}-research`,
      description: "Search for relevant information about the query",
      agentType: "research" as const,
      status: "not-started" as const,
      dependsOn: [],
      result: "",
      error: ""
    });
  }
  
  // Validate and fix dependencies
  for (const subtask of subtasksToAdd) {
    // Filter out dependencies for subtasks that won't be added
    if (subtask.dependsOn && subtask.dependsOn.length > 0) {
      subtask.dependsOn = subtask.dependsOn.filter((depId: string) => 
        subtasksToAdd.some(st => st.id === depId)
      );
    }
  }
  
  // Add the subtasks to the main task
  task.subtasks = subtasksToAdd;
  
  // Add a final compilation subtask if we have multiple subtasks
  if (subtasksToAdd.length > 1) {
    const allSubtaskIds = subtasksToAdd.map(st => st.id);
    
    task.subtasks.push({
      id: `${taskId}-compile`,
      description: "Combine and organize all gathered information into a coherent response",
      agentType: "compilation" as const,
      status: "not-started" as const,
      dependsOn: allSubtaskIds,
      result: "",
      error: ""
    });
  }
  
  return task;
}

/**
 * Generates a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Updates a subtask's status and result
 */
export function updateSubtask(
  task: TaskRoutingResult, 
  subtaskId: string, 
  update: Partial<TaskSubtask>
): TaskRoutingResult {
  const updatedTask = { ...task };
  const subtaskIndex = updatedTask.subtasks.findIndex(st => st.id === subtaskId);
  
  if (subtaskIndex === -1) {
    throw new Error(`Subtask with ID ${subtaskId} not found in task ${task.taskId}`);
  }
  
  updatedTask.subtasks[subtaskIndex] = {
    ...updatedTask.subtasks[subtaskIndex],
    ...update
  };
  
  // Check if all subtasks are completed
  const allCompleted = updatedTask.subtasks.every(
    st => st.status === 'completed' || st.status === 'failed'
  );
  
  if (allCompleted) {
    updatedTask.status = 'completed';
  }
  
  updatedTask.updatedAt = new Date().toISOString();
  return updatedTask;
}

/**
 * Gets the next subtask that can be executed based on dependencies
 */
export function getNextExecutableSubtask(task: TaskRoutingResult): TaskSubtask | null {
  // Find tasks that are still pending
  const pendingTasks = task.subtasks.filter(st => st.status === 'not-started');
  
  if (pendingTasks.length === 0) {
    return null; // No pending tasks
  }
  
  // Check for orphaned dependencies (dependencies that don't exist in the task list)
  for (const subtask of pendingTasks) {
    if (subtask.dependsOn && subtask.dependsOn.length > 0) {
      const missingDeps = subtask.dependsOn.filter(depId => 
        !task.subtasks.some(st => st.id === depId)
      );
      
      if (missingDeps.length > 0) {
        console.warn(`Task ${subtask.id} has dependencies that don't exist: ${missingDeps.join(', ')}`);
        
        // Fix the dependency list by removing non-existent dependencies
        subtask.dependsOn = subtask.dependsOn.filter(depId => 
          task.subtasks.some(st => st.id === depId)
        );
        
        if (subtask.dependsOn.length === 0) {
          console.log(`All dependencies for task ${subtask.id} were invalid; making it executable`);
          return subtask; // This task can now be executed
        }
      }
    }
  }
  
  // First prioritize tasks with no dependencies
  const tasksWithNoDeps = pendingTasks.filter(st => 
    !st.dependsOn || st.dependsOn.length === 0
  );
  
  if (tasksWithNoDeps.length > 0) {
    return tasksWithNoDeps[0];
  }
  
  // Then look for tasks whose dependencies are all completed
  for (const subtask of pendingTasks) {
    // Check if all dependencies are completed
    const allDependenciesMet = subtask.dependsOn!.every(depId => {
      const dependency = task.subtasks.find(st => st.id === depId);
      return dependency && dependency.status === 'completed';
    });
    
    if (allDependenciesMet) {
      return subtask;
    }
  }
  
  // Check for circular dependencies
  const dependencyGraph: Record<string, string[]> = {};
  
  // Build dependency graph
  for (const subtask of task.subtasks) {
    dependencyGraph[subtask.id] = subtask.dependsOn || [];
  }
  
  // Check for circular dependencies using DFS
  const visited: Set<string> = new Set();
  const recursionStack: Set<string> = new Set();
  
  function hasCycle(nodeId: string): boolean {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = dependencyGraph[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recursionStack.has(neighbor)) {
          console.warn(`Circular dependency detected involving tasks: ${nodeId} and ${neighbor}`);
          return true;
        }
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const subtask of pendingTasks) {
    if (!visited.has(subtask.id) && hasCycle(subtask.id)) {
      // Found a cycle - return the task with the fewest dependencies
      console.warn('Circular dependency detected in task graph, selecting task with fewest dependencies');
      return pendingTasks.sort((a, b) => 
        (a.dependsOn?.length || 0) - (b.dependsOn?.length || 0)
      )[0];
    }
  }
  
  return null; // No executable subtasks found
}

/**
 * Generic function to execute an agent query
 */
export async function executeAgentQuery(agentType: string, query: string): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    console.log(`Executing ${agentType} agent query: "${query}"`);
    
    // Check if running in browser or server environment
    const isClient = typeof window !== 'undefined';
    
    // Find the agent in presets
    const agent = PRESET_AGENTS.find(a => 
      a.id === agentType || (agentType === 'research' && a.id === 'research-agent')
    );
    
    if (!agent) {
      throw new Error(`Agent type "${agentType}" not found in presets`);
    }
    
    // If client-side, try direct API call for research agent
    if (isClient && agentType === 'research-agent') {
      try {
        const response = await fetch(`${window.location.origin}/api/agents/research-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return {
          success: data.success,
          response: data.data?.response,
          error: data.error
        };
      } catch (apiError) {
        console.error('Error calling API directly:', apiError);
        // Fall back to dynamic import if API call fails
      }
    }
    
    // Execute the appropriate agent based on type
    switch(agent.id) {
      
      case 'email-outreach': {
        // This would be implemented when the email agent is ready
        return {
          success: true,
          response: `[Email Agent] Processing query: ${query}`,
        };
      }
      
      case 'meeting-scheduler': {
        // This would be implemented when the meeting scheduler agent is ready
        return {
          success: true,
          response: `[Meeting Scheduler] Processing query: ${query}`,
        };
      }
      
      case 'data-analyzer': {
        // This would be implemented when the data analyzer agent is ready
        return {
          success: true,
          response: `[Data Analyzer] Processing query: ${query}`,
        };
      }
      
      case 'lead-qualifier': {
        // This would be implemented when the lead qualifier agent is ready
        return {
          success: true,
          response: `[Lead Qualifier] Processing query: ${query}`,
        };
      }
      
      default:
        throw new Error(`Agent implementation for "${agent.id}" not found`);
    }
  } catch (error) {
    console.error(`Error executing agent query:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Executes a given subtask using the appropriate agent
 */
export async function executeSubtask(
  task: TaskRoutingResult,
  subtaskId: string
): Promise<SubtaskExecutionResult> {
  try {
    console.log(`Executing subtask ${subtaskId}`);
    
    // Find the subtask to execute
    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }
    
    // Check if the subtask is already completed or in progress
    if (subtask.status === "completed") {
      return {
        success: true,
        result: subtask.result || "Task already completed",
        error: null,
      };
    }
    
    if (subtask.status === "in-progress") {
      return {
        success: false,
        result: null,
        error: "Task is already in progress",
      };
    }
    
    // Mark the subtask as in progress
    subtask.status = "in-progress";
    
    // Get dependencies results if needed
    const dependencyResults: Record<string, string> = {};
    if (subtask.dependsOn && subtask.dependsOn.length > 0) {
      for (const depId of subtask.dependsOn) {
        const dependency = task.subtasks.find((st) => st.id === depId);
        if (!dependency) {
          throw new Error(`Dependency ${depId} not found for subtask ${subtaskId}`);
        }
        
        if (dependency.status !== "completed") {
          throw new Error(`Dependency ${depId} is not completed yet`);
        }
        
        dependencyResults[depId] = dependency.result || "";
      }
    }
    
    // Execute the appropriate agent based on the agent type
    let result = "";
    
    switch (subtask.agentType) {
      case "research": {
        const query = determineResearchQuery(task.originalQuery, subtask);
        const agentResult = await executeAgentQuery('research-agent', query);
        result = agentResult.response || "No answer was found";
        break;
      }
      
      case "email-outreach": {
        const query = `${task.originalQuery} - ${subtask.description}`;
        const agentResult = await executeAgentQuery('email-outreach', query);
        result = agentResult.response || "Email outreach functionality is not yet fully implemented";
        break;
      }
      
      case "meeting-scheduler": {
        const query = `${task.originalQuery} - ${subtask.description}`;
        const agentResult = await executeAgentQuery('meeting-scheduler', query);
        result = agentResult.response || "Meeting scheduler functionality is not yet fully implemented";
        break;
      }
      
      case "data-analyzer": {
        const query = `${task.originalQuery} - ${subtask.description}`;
        const agentResult = await executeAgentQuery('data-analyzer', query);
        result = agentResult.response || "Data analyzer functionality is not yet fully implemented";
        break;
      }
      
      case "lead-qualifier": {
        const query = `${task.originalQuery} - ${subtask.description}`;
        const agentResult = await executeAgentQuery('lead-qualifier', query);
        result = agentResult.response || "Lead qualifier functionality is not yet fully implemented";
        break;
      }
      
      case "summary": {
        // Create a summary based on research results
        const researchResults = Object.values(dependencyResults).join("\n\n");
        result = await generateSummary(researchResults, task.originalQuery);
        break;
      }
      
      case "analysis": {
        // Analyze the research results
        const researchResults = Object.values(dependencyResults).join("\n\n");
        result = await analyzeContent(researchResults, task.originalQuery);
        break;
      }
      
      case "explanation": {
        // Provide an explanation
        result = await generateExplanation(task.originalQuery);
        break;
      }
      
      case "comparison": {
        // Compare different aspects
        const researchResults = Object.values(dependencyResults).join("\n\n");
        result = await generateComparison(researchResults, task.originalQuery);
        break;
      }
      
      case "recommendation": {
        // Provide recommendations
        const inputs = Object.values(dependencyResults).join("\n\n");
        result = await generateRecommendations(inputs, task.originalQuery);
        break;
      }
      
      case "planning": {
        // Create a plan
        const researchResults = Object.values(dependencyResults).join("\n\n");
        result = await generatePlan(researchResults, task.originalQuery);
        break;
      }
      
      case "compilation": {
        // Compile all results
        result = await compileResults(dependencyResults, task);
        break;
      }
      
      default:
        throw new Error(`Unknown agent type: ${subtask.agentType}`);
    }
    
    // Update the subtask with the result
    subtask.result = result;
    subtask.status = "completed";
    
    console.log(`Subtask ${subtaskId} completed successfully`);
    return {
      success: true,
      result: result,
      error: null,
    };
  } catch (error) {
    console.error(`Error executing subtask ${subtaskId}:`, error);
    
    // Find the subtask and update its status
    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (subtask) {
      subtask.status = "failed";
      subtask.error = error instanceof Error ? error.message : String(error);
    }
    
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Helper functions for different agent types
async function generateSummary(content: string, query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Summary of information about "${query}":\n\n${content.substring(0, 100)}...`;
}

async function analyzeContent(content: string, query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Analysis of information about "${query}":\n\n${content.substring(0, 100)}...`;
}

async function generateExplanation(query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Explanation of "${query}":\n\nThis is a placeholder explanation.`;
}

async function generateComparison(content: string, query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Comparison for "${query}":\n\n${content.substring(0, 100)}...`;
}

async function generateRecommendations(content: string, query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Recommendations for "${query}":\n\n1. First recommendation\n2. Second recommendation`;
}

async function generatePlan(content: string, query: string): Promise<string> {
  // In a real implementation, this would call an LLM
  return `Plan for "${query}":\n\n1. Step one\n2. Step two\n3. Step three`;
}

export async function compileResults(results: Record<string, string>, task: TaskRoutingResult): Promise<string> {
  // Combine all results into a coherent response
  let compiledResult = `Results for your query: "${task.originalQuery}"\n\n`;
  
  // Group results by agent type
  const researchResults = task.subtasks
    .filter(st => st.agentType === "research" && st.result)
    .map(st => st.result);
    
  const analysisResults = task.subtasks
    .filter(st => st.agentType === "analysis" && st.result)
    .map(st => st.result);
    
  const summaryResults = task.subtasks
    .filter(st => st.agentType === "summary" && st.result)
    .map(st => st.result);
    
  const recommendationResults = task.subtasks
    .filter(st => st.agentType === "recommendation" && st.result)
    .map(st => st.result);
    
  const planResults = task.subtasks
    .filter(st => st.agentType === "planning" && st.result)
    .map(st => st.result);
    
  // Add sections to the compiled result
  if (summaryResults.length > 0) {
    compiledResult += "## Summary\n\n" + summaryResults.join("\n\n") + "\n\n";
  }
  
  if (analysisResults.length > 0) {
    compiledResult += "## Analysis\n\n" + analysisResults.join("\n\n") + "\n\n";
  }
  
  if (recommendationResults.length > 0) {
    compiledResult += "## Recommendations\n\n" + recommendationResults.join("\n\n") + "\n\n";
  }
  
  if (planResults.length > 0) {
    compiledResult += "## Plan\n\n" + planResults.join("\n\n") + "\n\n";
  }
  
  if (researchResults.length > 0 && !summaryResults.length) {
    compiledResult += "## Research Findings\n\n" + researchResults.join("\n\n") + "\n\n";
  }
  
  return compiledResult;
}

function determineResearchQuery(originalQuery: string, subtask: TaskSubtask): string {
  // If there's no specific description, use the original query
  if (!subtask.description || subtask.description.includes("Search for relevant information")) {
    return originalQuery;
  }
  
  // Otherwise, construct a more specific query based on the subtask description
  return `${subtask.description} regarding: ${originalQuery}`;
}

/**
 * Executes a task by processing and tracking all subtasks
 */
export async function executeTask(task: TaskRoutingResult): Promise<TaskExecutionResult> {
  try {
    console.log("Executing task with ID:", task.taskId);
    
    // First, find subtasks with no dependencies that can be executed in parallel
    const readyToExecute = task.subtasks.filter(subtask => 
      (!subtask.dependsOn || subtask.dependsOn.length === 0) && 
      subtask.status === "not-started"
    );
    
    console.log(`Found ${readyToExecute.length} subtasks ready to execute`);
    
    // Execute each ready subtask in parallel
    const subtaskPromises = readyToExecute.map(subtask => 
      executeSubtask(task, subtask.id)
    );
    
    const results = await Promise.all(subtaskPromises);
    console.log(`Completed ${results.length} initial subtasks`);
    
    // Continue executing subtasks until all are complete or failed
    let hasProgress = true;
    while (hasProgress) {
      // Check if all subtasks are complete
      const allComplete = task.subtasks.every(st => 
        st.status === "completed" || st.status === "failed"
      );
      
      if (allComplete) {
        console.log("All subtasks completed or failed");
        break;
      }
      
      // Find new subtasks that can be executed (all dependencies are completed)
      const nextSubtasks = task.subtasks.filter(subtask => {
        if (subtask.status !== "not-started") return false;
        
        // Check if all dependencies are completed
        if (!subtask.dependsOn || subtask.dependsOn.length === 0) return false;
        
        const allDependenciesComplete = subtask.dependsOn.every(depId => {
          const dep = task.subtasks.find(st => st.id === depId);
          return dep && dep.status === "completed";
        });
        
        return allDependenciesComplete;
      });
      
      if (nextSubtasks.length === 0) {
        console.log("No more subtasks ready to execute, but not all are complete");
        hasProgress = false;
        continue;
      }
      
      console.log(`Found ${nextSubtasks.length} next subtasks to execute`);
      
      // Execute the next batch of subtasks in parallel
      const nextPromises = nextSubtasks.map(subtask => 
        executeSubtask(task, subtask.id)
      );
      
      const nextResults = await Promise.all(nextPromises);
      console.log(`Completed ${nextResults.length} additional subtasks`);
      
      hasProgress = nextResults.length > 0;
    }
    
    // Check if any subtasks failed
    const failedSubtasks = task.subtasks.filter(st => st.status === "failed");
    if (failedSubtasks.length > 0) {
      console.log(`${failedSubtasks.length} subtasks failed`);
      
      // Return a partial result with error information
      return {
        success: false,
        originalQuery: task.originalQuery,
        result: null,
        error: `${failedSubtasks.length} subtask(s) failed: ${failedSubtasks.map(st => st.error).join(", ")}`,
        subtasks: task.subtasks
      };
    }
    
    // Get the final result from the compilation subtask
    const compilationSubtask = task.subtasks.find(st => st.agentType === "compilation");
    const finalResult = compilationSubtask?.result || 
      "No compilation subtask was found, please check individual subtask results.";
    
    return {
      success: true,
      originalQuery: task.originalQuery,
      result: finalResult,
      error: null,
      subtasks: task.subtasks
    };
  } catch (error) {
    console.error("Error executing task:", error);
    return {
      success: false,
      originalQuery: task.originalQuery,
      result: null,
      error: error instanceof Error ? error.message : String(error),
      subtasks: task.subtasks
    };
  }
} 