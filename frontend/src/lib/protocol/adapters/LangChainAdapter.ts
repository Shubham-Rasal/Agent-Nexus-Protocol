/**
 * LangChain Protocol Adapter
 * 
 * Adapter for integrating LangChain agents with the Agent Communication Protocol
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

export class LangChainAdapter extends BaseAdapter {
  framework = AgentFramework.LANGCHAIN;
  version = "0.2.0";

  /**
   * Convert LangChain message to ACP message
   */
  toACPMessage(frameworkMessage: any): AgentMessage {
    // LangChain typically uses a format like:
    // { type: "ai" | "human" | "system", content: string, additional_kwargs?: any }
    
    let messageType = MessageType.RESPONSE;
    if (frameworkMessage.type === "human") {
      messageType = MessageType.QUERY;
    } else if (frameworkMessage.additional_kwargs?.function_call) {
      messageType = MessageType.TASK_REQUEST;
    }

    return this.createACPMessage(
      messageType,
      frameworkMessage.name || "langchain_agent",
      "router",
      {
        content: frameworkMessage.content,
        metadata: frameworkMessage.additional_kwargs,
        type: frameworkMessage.type,
      }
    );
  }

  /**
   * Convert ACP message to LangChain message
   */
  fromACPMessage(acpMessage: AgentMessage): any {
    // Convert to LangChain's BaseMessage format
    let messageType = "ai";
    
    if (acpMessage.messageType === MessageType.QUERY) {
      messageType = "human";
    } else if (acpMessage.messageType === MessageType.CONTEXT) {
      messageType = "system";
    }

    return {
      type: messageType,
      content: typeof acpMessage.payload === 'string' 
        ? acpMessage.payload 
        : JSON.stringify(acpMessage.payload),
      name: acpMessage.from,
      additional_kwargs: {
        messageId: acpMessage.messageId,
        timestamp: acpMessage.timestamp,
        protocol: acpMessage.protocol,
      },
    };
  }

  /**
   * Extract capabilities from LangChain agent configuration
   */
  extractCapabilities(frameworkConfig: any): AgentCapability[] {
    const capabilities: AgentCapability[] = [];

    // LangChain agents typically have tools
    if (frameworkConfig.tools && Array.isArray(frameworkConfig.tools)) {
      frameworkConfig.tools.forEach((tool: any) => {
        capabilities.push({
          id: tool.name || tool.id,
          name: tool.name || tool.id,
          category: this.mapToolToCategory(tool.name),
          description: tool.description || `LangChain tool: ${tool.name}`,
          inputSchema: tool.args_schema,
        });
      });
    }

    // Add general capabilities based on agent type
    if (frameworkConfig.agent_type) {
      capabilities.push({
        id: `langchain_${frameworkConfig.agent_type}`,
        name: `LangChain ${frameworkConfig.agent_type} Agent`,
        category: CapabilityCategory.GENERAL,
        description: `LangChain agent of type: ${frameworkConfig.agent_type}`,
      });
    }

    // Check for memory/context capabilities
    if (frameworkConfig.memory) {
      capabilities.push({
        id: "conversation_memory",
        name: "Conversation Memory",
        category: CapabilityCategory.GENERAL,
        description: "Maintains conversation context and history",
      });
    }

    return capabilities;
  }

  /**
   * Execute a task using LangChain
   */
  async executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload> {
    // This would integrate with actual LangChain execution
    // For now, return a structured response
    
    const startTime = Date.now();
    
    try {
      // In a real implementation, you would:
      // 1. Initialize LangChain agent with appropriate tools
      // 2. Pass the task description and context
      // 3. Execute the agent
      // 4. Return formatted results
      
      const result = {
        taskId: task.taskId,
        result: {
          message: "Task executed via LangChain adapter",
          context: context,
          // Actual LangChain execution result would go here
        },
        summary: `Completed task: ${task.title}`,
        metadata: {
          executionTime: Date.now() - startTime,
          framework: "langchain",
          toolsUsed: context?.tools || [],
        },
      };

      return result;
    } catch (error) {
      throw new Error(`LangChain execution failed: ${error}`);
    }
  }

  /**
   * Check if LangChain supports a capability
   */
  supportsCapability(capability: string): boolean {
    const supportedCapabilities = [
      "text_generation",
      "question_answering",
      "summarization",
      "tool_usage",
      "conversation",
      "reasoning",
      "web_search",
      "document_qa",
    ];

    return supportedCapabilities.some(cap => 
      capability.toLowerCase().includes(cap)
    );
  }

  /**
   * Map tool name to capability category
   */
  private mapToolToCategory(toolName: string): CapabilityCategory {
    const name = toolName.toLowerCase();
    
    if (name.includes("search") || name.includes("browse")) {
      return CapabilityCategory.RESEARCH;
    }
    if (name.includes("analyze") || name.includes("data")) {
      return CapabilityCategory.DATA_ANALYSIS;
    }
    if (name.includes("write") || name.includes("generate")) {
      return CapabilityCategory.CONTENT_GENERATION;
    }
    if (name.includes("code") || name.includes("python")) {
      return CapabilityCategory.CODE_GENERATION;
    }
    if (name.includes("email") || name.includes("message")) {
      return CapabilityCategory.COMMUNICATION;
    }
    
    return CapabilityCategory.GENERAL;
  }

  /**
   * Get LangChain-specific configuration schema
   */
  getConfigSchema(): Record<string, any> {
    return {
      ...super.getConfigSchema(),
      properties: {
        ...super.getConfigSchema().properties,
        agent_type: {
          type: "string",
          enum: ["zero-shot-react-description", "chat-conversational-react-description", "structured-chat-zero-shot-react-description"],
        },
        tools: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        memory: {
          type: "object",
          properties: {
            type: { type: "string" },
            max_tokens: { type: "number" },
          },
        },
        llm: {
          type: "object",
          properties: {
            model: { type: "string" },
            temperature: { type: "number" },
          },
        },
      },
    };
  }
}
