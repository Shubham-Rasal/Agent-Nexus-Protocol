import { NextResponse } from "next/server";
import { agents } from '@/app/agents.json';
import { relationships } from '@/app/relationships.json';

type AgentInfo = (typeof agents)[0];

type SubTask = {
  id: string;
  description: string;
  agent: AgentInfo;
  status: 'pending' | 'in-progress' | 'completed';
  response?: string;
  thoughtProcess?: string;
};

type Relationship = (typeof relationships)[0];

export async function POST(req: Request) {
  try {
    const { query, minConfidence = 0.8 } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`Task Router: Processing query "${query}"`);

    // Step 1: Decompose the query into subtasks using LLM
    const subtasks = await decomposeTask(query);
    console.log(`Task Router: Decomposed into ${subtasks.length} subtasks:`, subtasks);
    
    // Step 2: Find best agents for each subtask
    const tasks = await assignAgents(subtasks, minConfidence);
    console.log(`Task Router: Assigned ${tasks.length} agents to subtasks`);
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Task Router Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Uses the LLM to decompose a complex task into simpler subtasks
 */
async function decomposeTask(query: string): Promise<string[]> {
  try {
    const API_URL = "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
    const API_TOKEN = process.env.LILYPAD_API_TOKEN;

    const systemPrompt = `You are an expert task decomposer for the Agent Nexus Protocol. 
    Your job is to break down complex user queries into 2-4 specific subtasks that can be assigned to specialized AI agents.
    Each subtask should be focused on a single aspect of the problem and be self-contained.
    Respond ONLY with a JSON array of strings, each describing a subtask. Do not include any other text or explanations.`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Break this query into 2-4 specific subtasks: "${query}"`
      }
    ];

    const requestBody = {
      model: "llama3.1:8b",
      messages,
      max_tokens: 2048,
      temperature: 0.3,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`LLM API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // Parse the response as JSON array (clean it first if needed)
    let subtasks: string[] = [];
    
    if (result.choices && result.choices[0] && result.choices[0].message.content) {
      const content = result.choices[0].message.content.trim();
      
      try {
        // Try to parse directly first
        if (content.startsWith('[') && content.endsWith(']')) {
          subtasks = JSON.parse(content);
        } else {
          // Extract JSON array if wrapped in markdown or extra text
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            subtasks = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback - split by newlines and clean up
            subtasks = content.split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line && !line.startsWith('```') && !line.endsWith('```'));
          }
        }
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        // If JSON parsing fails, treat each line as a task
        subtasks = content.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && !line.startsWith('```') && !line.endsWith('```'));
      }
    }

    if (subtasks.length === 0) {
      // Fallback for when the LLM doesn't return properly formatted tasks
      subtasks = [
        "Research background information",
        "Analyze domain-specific factors",
        "Provide recommendations and next steps"
      ];
    }

    return subtasks;
  } catch (error) {
    console.error("Error decomposing task:", error);
    // Fallback tasks in case of an error
    return [
      "Research background information",
      "Analyze domain-specific factors", 
      "Provide recommendations and next steps"
    ];
  }
}

/**
 * Finds the most appropriate agents for each subtask based on:
 * 1. Agent capabilities (from agent descriptions)
 * 2. Relationship weights with other agents
 * 3. Agent stake (importance in the network)
 */
async function assignAgents(subtasks: string[], minConfidence: number): Promise<SubTask[]> {
  // Create a graph representation of agent relationships
  const agentGraph = buildAgentGraph();
  
  // Match tasks to agents
  const tasks: SubTask[] = [];
  const assignedAgents = new Set<string>(); // Track already assigned agents to avoid duplicates

  for (const subtask of subtasks) {
    // Find the best agent for this subtask
    const rankedAgents = rankAgentsForTask(subtask, agentGraph, assignedAgents);
    
    if (rankedAgents.length > 0) {
      // Get the top agent
      const bestAgent = rankedAgents[0].agent;
      
      // Create the subtask
      tasks.push({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        description: subtask,
        agent: bestAgent,
        status: 'pending'
      });
      
      // Mark this agent as assigned
      assignedAgents.add(bestAgent.id);
    }
  }

  return tasks;
}

/**
 * Builds a graph representation of agent relationships
 */
function buildAgentGraph() {
  const graph: Record<string, { agent: AgentInfo, connections: Record<string, number> }> = {};
  
  // Initialize graph with all agents
  for (const agent of agents) {
    graph[agent.id] = {
      agent,
      connections: {}
    };
  }
  
  // Add relationship edges
  for (const rel of relationships) {
    if (graph[rel.source] && graph[rel.target]) {
      graph[rel.source].connections[rel.target] = rel.strength;
      graph[rel.target].connections[rel.source] = rel.strength;
    }
  }
  
  return graph;
}

/**
 * Ranks agents for a specific task based on:
 * 1. Semantic match between task and agent description
 * 2. Agent stake (importance)
 * 3. Relationship weights with already assigned agents
 */
function rankAgentsForTask(
  task: string, 
  agentGraph: Record<string, { agent: AgentInfo, connections: Record<string, number> }>,
  assignedAgents: Set<string>
) {
  const taskWords = new Set(task.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  
  // Score each agent
  const scoredAgents = agents
    .filter(agent => !assignedAgents.has(agent.id)) // Exclude already assigned agents
    .map(agent => {
      // 1. Calculate semantic match based on word overlap
      const agentText = `${agent.name} ${agent.description}`.toLowerCase();
      const agentWords = new Set(agentText.split(/\W+/).filter(w => w.length > 3));
      
      let overlapScore = 0;
      for (const word of taskWords) {
        if (agentWords.has(word)) overlapScore++;
        // Also look for partial matches (e.g. "compliance" matches "compliant")
        else {
          for (const agentWord of agentWords) {
            if (agentWord.includes(word) || word.includes(agentWord)) {
              overlapScore += 0.5;
              break;
            }
          }
        }
      }
      
      // Normalize to 0-1 range
      const semanticScore = taskWords.size > 0 ? overlapScore / taskWords.size : 0;
      
      // 2. Calculate stake score (normalized to 0-1)
      const maxStake = 5000; // Assumed maximum stake
      const stakeScore = agent.stake / maxStake;
      
      // 3. Calculate relationship score with already assigned agents
      let relationshipScore = 0;
      if (assignedAgents.size > 0) {
        let totalStrength = 0;
        for (const assignedId of assignedAgents) {
          const strength = agentGraph[agent.id]?.connections[assignedId] || 0;
          totalStrength += strength;
        }
        relationshipScore = totalStrength / assignedAgents.size;
      }
      
      // Calculate final score (weighted combination)
      const finalScore = (
        semanticScore * 0.6 + // Semantic match is most important
        stakeScore * 0.3 +    // Stake indicates agent quality
        relationshipScore * 0.1 // Relationships matter but less for initial assignment
      );
      
      return {
        agent,
        score: finalScore,
        details: {
          semanticScore,
          stakeScore,
          relationshipScore
        }
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by descending score
  
  // Log the top 3 agents for this task
  if (scoredAgents.length > 0) {
    console.log(`Task: "${task}" - Top agents:`);
    scoredAgents.slice(0, Math.min(3, scoredAgents.length)).forEach((agent, idx) => {
      console.log(`  ${idx+1}. ${agent.agent.name} (Score: ${agent.score.toFixed(2)}) - Semantic: ${agent.details.semanticScore.toFixed(2)}, Stake: ${agent.details.stakeScore.toFixed(2)}, Relationship: ${agent.details.relationshipScore.toFixed(2)}`);
    });
  }
    
  return scoredAgents;
} 