/**
 * CrewAI Protocol Adapter
 * 
 * Adapter for integrating CrewAI agents with the Agent Communication Protocol
 */

import { BaseAdapter } from './BaseAdapter';
import {
  AgentFramework,
  AgentMessage,
  AgentCapability,
  TaskRequestPayload,
  TaskCompletePayload,
  MessageType,
  CapabilityCategory,
} from '@/types/agentCommunicationProtocol';

export class CrewAIAdapter extends BaseAdapter {
  framework = AgentFramework.CREWAI;
  version = "0.1.0";

  /**
   * Convert CrewAI message to ACP message
   */
  toACPMessage(frameworkMessage: any): AgentMessage {
    // CrewAI uses a crew/agent/task structure
    let messageType = MessageType.RESPONSE;
    
    if (frameworkMessage.task) {
      messageType = MessageType.TASK_REQUEST;
    } else if (frameworkMessage.delegation) {
      messageType = MessageType.DELEGATE;
    }

    return this.createACPMessage(
      messageType,
      frameworkMessage.agent_id || frameworkMessage.role || "crewai_agent",
      frameworkMessage.target || "router",
      {
        content: frameworkMessage.output || frameworkMessage.description,
        role: frameworkMessage.role,
        goal: frameworkMessage.goal,
        backstory: frameworkMessage.backstory,
        task: frameworkMessage.task,
        tools: frameworkMessage.tools,
      }
    );
  }

  /**
   * Convert ACP message to CrewAI format
   */
  fromACPMessage(acpMessage: AgentMessage): any {
    const payload = acpMessage.payload as any;

    return {
      agent_id: acpMessage.from,
      role: payload.role || "Assistant",
      goal: payload.goal || "Complete assigned task",
      backstory: payload.backstory || "An AI agent in the crew",
      task: {
        description: payload.content || payload.description,
        expected_output: payload.expectedOutput,
      },
      output: payload.content,
      tools: payload.tools || [],
      delegation: acpMessage.messageType === MessageType.DELEGATE,
    };
  }

  /**
   * Extract capabilities from CrewAI configuration
   */
  extractCapabilities(frameworkConfig: any): AgentCapability[] {
    const capabilities: AgentCapability[] = [];

    // Extract from agent role and goal
    if (frameworkConfig.role) {
      capabilities.push({
        id: `crewai_role_${frameworkConfig.role.toLowerCase().replace(/\s+/g, '_')}`,
        name: frameworkConfig.role,
        category: this.mapRoleToCategory(frameworkConfig.role),
        description: frameworkConfig.goal || `CrewAI agent with role: ${frameworkConfig.role}`,
      });
    }

    // Extract from tools
    if (frameworkConfig.tools && Array.isArray(frameworkConfig.tools)) {
      frameworkConfig.tools.forEach((tool: any) => {
        capabilities.push({
          id: typeof tool === 'string' ? tool : tool.name,
          name: typeof tool === 'string' ? tool : tool.name,
          category: CapabilityCategory.INTEGRATION,
          description: typeof tool === 'object' ? tool.description : `Tool: ${tool}`,
        });
      });
    }

    // CrewAI agents can delegate
    capabilities.push({
      id: "task_delegation",
      name: "Task Delegation",
      category: CapabilityCategory.TASK_PLANNING,
      description: "Can delegate tasks to other agents in the crew",
    });

    // CrewAI agents work in crews
    if (frameworkConfig.allow_delegation !== false) {
      capabilities.push({
        id: "collaborative_work",
        name: "Collaborative Work",
        category: CapabilityCategory.GENERAL,
        description: "Works collaboratively with other agents",
      });
    }

    return capabilities;
  }

  /**
   * Execute a task using CrewAI
   */
  async executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload> {
    const startTime = Date.now();

    try {
      // In a real implementation, you would:
      // 1. Create a CrewAI task from the task payload
      // 2. Assign to appropriate agent(s)
      // 3. Execute the crew
      // 4. Return results
      
      const result = {
        taskId: task.taskId,
        result: {
          message: "Task executed via CrewAI adapter",
          agent_role: context?.role,
          crew_output: {
            description: task.description,
            // Actual CrewAI execution result would go here
          },
        },
        summary: `CrewAI agent completed: ${task.title}`,
        metadata: {
          executionTime: Date.now() - startTime,
          framework: "crewai",
          role: context?.role,
          toolsUsed: context?.tools || [],
          delegation_used: context?.allow_delegation,
        },
      };

      return result;
    } catch (error) {
      throw new Error(`CrewAI execution failed: ${error}`);
    }
  }

  /**
   * Check if CrewAI supports a capability
   */
  supportsCapability(capability: string): boolean {
    const supportedCapabilities = [
      "task_execution",
      "task_delegation",
      "collaborative_work",
      "role_based_execution",
      "sequential_processing",
      "hierarchical_processing",
      "tool_usage",
      "context_awareness",
    ];

    return supportedCapabilities.some(cap => 
      capability.toLowerCase().includes(cap)
    );
  }

  /**
   * Map role to capability category
   */
  private mapRoleToCategory(role: string): CapabilityCategory {
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes("researcher") || roleLower.includes("analyst")) {
      return CapabilityCategory.RESEARCH;
    }
    if (roleLower.includes("writer") || roleLower.includes("content")) {
      return CapabilityCategory.CONTENT_GENERATION;
    }
    if (roleLower.includes("planner") || roleLower.includes("manager")) {
      return CapabilityCategory.TASK_PLANNING;
    }
    if (roleLower.includes("developer") || roleLower.includes("coder")) {
      return CapabilityCategory.CODE_GENERATION;
    }
    if (roleLower.includes("data") || roleLower.includes("analyzer")) {
      return CapabilityCategory.DATA_ANALYSIS;
    }
    
    return CapabilityCategory.GENERAL;
  }

  /**
   * Get CrewAI-specific configuration schema
   */
  getConfigSchema(): Record<string, any> {
    return {
      ...super.getConfigSchema(),
      properties: {
        ...super.getConfigSchema().properties,
        role: {
          type: "string",
          description: "The role of this agent in the crew",
        },
        goal: {
          type: "string",
          description: "The goal the agent is trying to achieve",
        },
        backstory: {
          type: "string",
          description: "The backstory of the agent, adds personality",
        },
        tools: {
          type: "array",
          items: {
            oneOf: [
              { type: "string" },
              {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            ],
          },
        },
        allow_delegation: {
          type: "boolean",
          default: true,
          description: "Whether the agent can delegate tasks",
        },
        verbose: {
          type: "boolean",
          default: false,
        },
        max_iter: {
          type: "number",
          default: 15,
          description: "Maximum iterations for task execution",
        },
      },
      required: ["role", "goal"],
    };
  }
}
