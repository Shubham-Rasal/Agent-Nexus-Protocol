/**
 * OpenAI Assistants Protocol Adapter
 * 
 * Adapter for integrating OpenAI Assistants API with the Agent Communication Protocol
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

export class OpenAIAssistantsAdapter extends BaseAdapter {
  framework = AgentFramework.OPENAI_ASSISTANTS;
  version = "2.0.0";

  /**
   * Convert OpenAI Assistant message to ACP message
   */
  toACPMessage(frameworkMessage: any): AgentMessage {
    // OpenAI Assistants use: { role: "assistant" | "user", content: string, ... }
    let messageType = MessageType.RESPONSE;
    
    if (frameworkMessage.role === "user") {
      messageType = MessageType.QUERY;
    } else if (frameworkMessage.tool_calls) {
      messageType = MessageType.TASK_REQUEST;
    }

    return this.createACPMessage(
      messageType,
      frameworkMessage.assistant_id || "openai_assistant",
      "router",
      {
        content: this.extractContent(frameworkMessage.content),
        role: frameworkMessage.role,
        tool_calls: frameworkMessage.tool_calls,
        metadata: frameworkMessage.metadata,
        annotations: frameworkMessage.annotations,
      }
    );
  }

  /**
   * Convert ACP message to OpenAI Assistant message format
   */
  fromACPMessage(acpMessage: AgentMessage): any {
    const payload = acpMessage.payload as any;

    return {
      role: acpMessage.messageType === MessageType.QUERY ? "user" : "assistant",
      content: typeof payload === 'string' ? payload : payload.content,
      assistant_id: acpMessage.from,
      metadata: {
        messageId: acpMessage.messageId,
        timestamp: acpMessage.timestamp,
        protocol: acpMessage.protocol,
      },
    };
  }

  /**
   * Extract capabilities from OpenAI Assistant configuration
   */
  extractCapabilities(frameworkConfig: any): AgentCapability[] {
    const capabilities: AgentCapability[] = [];

    // Extract from model
    if (frameworkConfig.model) {
      capabilities.push({
        id: `openai_${frameworkConfig.model}`,
        name: `OpenAI ${frameworkConfig.model}`,
        category: CapabilityCategory.GENERAL,
        description: `OpenAI assistant powered by ${frameworkConfig.model}`,
      });
    }

    // Extract from tools
    if (frameworkConfig.tools && Array.isArray(frameworkConfig.tools)) {
      frameworkConfig.tools.forEach((tool: any) => {
        if (tool.type === "code_interpreter") {
          capabilities.push({
            id: "code_interpreter",
            name: "Code Interpreter",
            category: CapabilityCategory.CODE_GENERATION,
            description: "Can write and run Python code",
          });
        } else if (tool.type === "retrieval" || tool.type === "file_search") {
          capabilities.push({
            id: "file_search",
            name: "File Search",
            category: CapabilityCategory.RESEARCH,
            description: "Can search and retrieve information from files",
          });
        } else if (tool.type === "function") {
          capabilities.push({
            id: tool.function?.name || "custom_function",
            name: tool.function?.name || "Custom Function",
            category: CapabilityCategory.INTEGRATION,
            description: tool.function?.description || "Custom function capability",
            inputSchema: tool.function?.parameters,
          });
        }
      });
    }

    // Extract from instructions
    if (frameworkConfig.instructions) {
      capabilities.push({
        id: "specialized_instructions",
        name: "Specialized Instructions",
        category: CapabilityCategory.SPECIALIZED,
        description: frameworkConfig.instructions.substring(0, 200),
      });
    }

    return capabilities;
  }

  /**
   * Execute a task using OpenAI Assistants
   */
  async executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload> {
    const startTime = Date.now();

    try {
      // In a real implementation, you would:
      // 1. Create or use existing OpenAI Assistant
      // 2. Create a thread
      // 3. Add message to thread
      // 4. Run the assistant
      // 5. Retrieve and return results
      
      const result = {
        taskId: task.taskId,
        result: {
          message: "Task executed via OpenAI Assistants adapter",
          assistant_id: context?.assistant_id,
          thread_id: context?.thread_id,
          // Actual OpenAI Assistant execution result would go here
        },
        summary: `OpenAI Assistant completed: ${task.title}`,
        metadata: {
          executionTime: Date.now() - startTime,
          framework: "openai_assistants",
          model: context?.model,
          toolsUsed: context?.tools?.map((t: any) => t.type) || [],
        },
      };

      return result;
    } catch (error) {
      throw new Error(`OpenAI Assistants execution failed: ${error}`);
    }
  }

  /**
   * Check if OpenAI Assistants support a capability
   */
  supportsCapability(capability: string): boolean {
    const supportedCapabilities = [
      "conversation",
      "code_execution",
      "code_interpreter",
      "file_search",
      "retrieval",
      "function_calling",
      "long_context",
      "structured_output",
      "vision",
      "multimodal",
    ];

    return supportedCapabilities.some(cap => 
      capability.toLowerCase().includes(cap)
    );
  }

  /**
   * Extract text content from OpenAI content format
   */
  private extractContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      return content
        .filter(item => item.type === 'text')
        .map(item => item.text?.value || '')
        .join('\n');
    }
    
    return '';
  }

  /**
   * Get OpenAI Assistants-specific configuration schema
   */
  getConfigSchema(): Record<string, any> {
    return {
      ...super.getConfigSchema(),
      properties: {
        ...super.getConfigSchema().properties,
        model: {
          type: "string",
          enum: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
          description: "The OpenAI model to use",
        },
        instructions: {
          type: "string",
          description: "System instructions for the assistant",
        },
        tools: {
          type: "array",
          items: {
            oneOf: [
              {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["code_interpreter", "file_search"] },
                },
              },
              {
                type: "object",
                properties: {
                  type: { type: "string", const: "function" },
                  function: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      parameters: { type: "object" },
                    },
                  },
                },
              },
            ],
          },
        },
        temperature: {
          type: "number",
          minimum: 0,
          maximum: 2,
          default: 1,
        },
        top_p: {
          type: "number",
          minimum: 0,
          maximum: 1,
          default: 1,
        },
        metadata: {
          type: "object",
        },
      },
      required: ["model"],
    };
  }
}
