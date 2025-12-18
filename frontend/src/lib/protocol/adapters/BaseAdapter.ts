/**
 * Base Protocol Adapter
 * 
 * Abstract base class for implementing framework-specific protocol adapters
 */

import {
  ProtocolAdapter,
  AgentFramework,
  AgentMessage,
  AgentCapability,
  TaskRequestPayload,
  TaskCompletePayload,
  MessageType,
  PROTOCOL_VERSION,
} from '@/types/agentCommunicationProtocol';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAdapter implements ProtocolAdapter {
  abstract framework: AgentFramework;
  abstract version: string;

  /**
   * Generate a standard ACP message envelope
   */
  protected createACPMessage<T>(
    type: MessageType,
    from: string,
    to: string | string[],
    payload: T,
    options?: {
      replyTo?: string;
      conversationId?: string;
      priority?: "low" | "normal" | "high" | "urgent";
    }
  ): AgentMessage<T> {
    return {
      protocol: `ACP/${PROTOCOL_VERSION}`,
      messageType: type,
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      from,
      to,
      payload,
      ...options,
    };
  }

  /**
   * Validate ACP message format
   */
  protected validateACPMessage(message: AgentMessage): boolean {
    if (!message.protocol?.startsWith('ACP/')) return false;
    if (!message.messageType) return false;
    if (!message.messageId) return false;
    if (!message.from) return false;
    if (!message.to) return false;
    if (!message.timestamp) return false;
    return true;
  }

  /**
   * Convert framework-specific message to ACP message
   * Must be implemented by subclasses
   */
  abstract toACPMessage(frameworkMessage: any): AgentMessage;

  /**
   * Convert ACP message to framework-specific message
   * Must be implemented by subclasses
   */
  abstract fromACPMessage(acpMessage: AgentMessage): any;

  /**
   * Extract agent capabilities from framework configuration
   * Must be implemented by subclasses
   */
  abstract extractCapabilities(frameworkConfig: any): AgentCapability[];

  /**
   * Execute a task using the framework
   * Must be implemented by subclasses
   */
  abstract executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload>;

  /**
   * Check if the framework supports a specific capability
   */
  abstract supportsCapability(capability: string): boolean;

  /**
   * Get framework-specific configuration schema
   */
  getConfigSchema(): Record<string, any> {
    return {
      type: "object",
      properties: {
        framework: { type: "string", const: this.framework },
        version: { type: "string" },
      },
      required: ["framework"],
    };
  }
}
