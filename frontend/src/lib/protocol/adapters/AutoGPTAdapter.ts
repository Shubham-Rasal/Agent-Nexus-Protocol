/**
 * AutoGPT Protocol Adapter
 * 
 * Adapter for integrating AutoGPT agents with the Agent Communication Protocol
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

export class AutoGPTAdapter extends BaseAdapter {
  framework = AgentFramework.AUTOGPT;
  version = "0.5.0";

  /**
   * Convert AutoGPT message to ACP message
   */
  toACPMessage(frameworkMessage: any): AgentMessage {
    let messageType = MessageType.RESPONSE;
    
    if (frameworkMessage.command) {
      messageType = MessageType.TASK_REQUEST;
    } else if (frameworkMessage.thoughts) {
      messageType = MessageType.THOUGHT;
    }

    return this.createACPMessage(
      messageType,
      frameworkMessage.agent_id || "autogpt_agent",
      frameworkMessage.target || "router",
      {
        content: frameworkMessage.text || frameworkMessage.response,
        thoughts: frameworkMessage.thoughts,
        command: frameworkMessage.command,
        plan: frameworkMessage.plan,
        criticism: frameworkMessage.criticism,
        reasoning: frameworkMessage.reasoning,
      }
    );
  }

  /**
   * Convert ACP message to AutoGPT format
   */
  fromACPMessage(acpMessage: AgentMessage): any {
    const payload = acpMessage.payload as any;

    return {
      agent_id: acpMessage.from,
      text: payload.content || payload.text,
      thoughts: {
        text: payload.thoughts?.text || payload.content,
        reasoning: payload.thoughts?.reasoning || payload.reasoning,
        plan: payload.thoughts?.plan || payload.plan,
        criticism: payload.thoughts?.criticism || payload.criticism,
      },
      command: payload.command,
      timestamp: acpMessage.timestamp,
    };
  }

  /**
   * Extract capabilities from AutoGPT configuration
   */
  extractCapabilities(frameworkConfig: any): AgentCapability[] {
    const capabilities: AgentCapability[] = [];

    // AutoGPT has autonomous goal pursuit
    capabilities.push({
      id: "autonomous_goal_pursuit",
      name: "Autonomous Goal Pursuit",
      category: CapabilityCategory.TASK_PLANNING,
      description: "Can autonomously break down and pursue goals",
    });

    // Command execution
    capabilities.push({
      id: "command_execution",
      name: "Command Execution",
      category: CapabilityCategory.GENERAL,
      description: "Can execute various system commands",
    });

    // Self-critique and reasoning
    capabilities.push({
      id: "self_critique",
      name: "Self-Critique",
      category: CapabilityCategory.GENERAL,
      description: "Can evaluate and critique its own reasoning",
    });

    // Extract from enabled commands
    if (frameworkConfig.enabled_commands && Array.isArray(frameworkConfig.enabled_commands)) {
      frameworkConfig.enabled_commands.forEach((cmd: string) => {
        capabilities.push({
          id: `command_${cmd}`,
          name: `Command: ${cmd}`,
          category: this.mapCommandToCategory(cmd),
          description: `Can execute: ${cmd}`,
        });
      });
    }

    // File operations
    if (frameworkConfig.allow_file_operations !== false) {
      capabilities.push({
        id: "file_operations",
        name: "File Operations",
        category: CapabilityCategory.INTEGRATION,
        description: "Can read, write, and manage files",
      });
    }

    // Memory management
    capabilities.push({
      id: "memory_management",
      name: "Memory Management",
      category: CapabilityCategory.GENERAL,
      description: "Long-term and short-term memory management",
    });

    return capabilities;
  }

  /**
   * Execute a task using AutoGPT
   */
  async executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload> {
    const startTime = Date.now();

    try {
      // In a real implementation, you would:
      // 1. Initialize AutoGPT with goals
      // 2. Set up constraints and resources
      // 3. Run the autonomous loop
      // 4. Return results with thought process
      
      const result = {
        taskId: task.taskId,
        result: {
          message: "Task executed via AutoGPT adapter",
          thoughts: {
            text: `Analyzing task: ${task.title}`,
            reasoning: "Breaking down the task into actionable steps",
            plan: ["Step 1: Analyze requirements", "Step 2: Execute", "Step 3: Verify"],
            criticism: "Need to ensure thoroughness",
          },
          // Actual AutoGPT execution result would go here
        },
        summary: `AutoGPT autonomously completed: ${task.title}`,
        metadata: {
          executionTime: Date.now() - startTime,
          framework: "autogpt",
          iterations: context?.iterations || 1,
          commandsExecuted: context?.commands_executed || [],
        },
      };

      return result;
    } catch (error) {
      throw new Error(`AutoGPT execution failed: ${error}`);
    }
  }

  /**
   * Check if AutoGPT supports a capability
   */
  supportsCapability(capability: string): boolean {
    const supportedCapabilities = [
      "autonomous_execution",
      "goal_pursuit",
      "command_execution",
      "file_operations",
      "web_browsing",
      "code_execution",
      "memory_management",
      "self_reflection",
      "planning",
      "criticism",
    ];

    return supportedCapabilities.some(cap => 
      capability.toLowerCase().includes(cap)
    );
  }

  /**
   * Map command to capability category
   */
  private mapCommandToCategory(command: string): CapabilityCategory {
    const cmdLower = command.toLowerCase();
    
    if (cmdLower.includes("search") || cmdLower.includes("browse")) {
      return CapabilityCategory.RESEARCH;
    }
    if (cmdLower.includes("analyze") || cmdLower.includes("evaluate")) {
      return CapabilityCategory.DATA_ANALYSIS;
    }
    if (cmdLower.includes("write") || cmdLower.includes("generate")) {
      return CapabilityCategory.CONTENT_GENERATION;
    }
    if (cmdLower.includes("code") || cmdLower.includes("execute")) {
      return CapabilityCategory.CODE_GENERATION;
    }
    if (cmdLower.includes("file") || cmdLower.includes("read") || cmdLower.includes("write_file")) {
      return CapabilityCategory.INTEGRATION;
    }
    
    return CapabilityCategory.GENERAL;
  }

  /**
   * Get AutoGPT-specific configuration schema
   */
  getConfigSchema(): Record<string, any> {
    return {
      ...super.getConfigSchema(),
      properties: {
        ...super.getConfigSchema().properties,
        ai_name: {
          type: "string",
          description: "Name of the AI agent",
        },
        ai_role: {
          type: "string",
          description: "Role description for the AI",
        },
        ai_goals: {
          type: "array",
          items: { type: "string" },
          description: "List of goals for the AI to pursue",
        },
        enabled_commands: {
          type: "array",
          items: { type: "string" },
          description: "Commands the agent is allowed to use",
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Constraints on agent behavior",
        },
        resources: {
          type: "array",
          items: { type: "string" },
          description: "Available resources for the agent",
        },
        allow_file_operations: {
          type: "boolean",
          default: true,
        },
        memory_backend: {
          type: "string",
          enum: ["local", "pinecone", "redis"],
          default: "local",
        },
        continuous_mode: {
          type: "boolean",
          default: false,
          description: "Whether to run in continuous mode",
        },
      },
    };
  }
}
