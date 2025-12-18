/**
 * Protocol Utilities
 * 
 * Utility functions for working with the Agent Communication Protocol
 */

import {
  AgentMessage,
  MessageType,
  TaskRequestPayload,
  TaskCompletePayload,
  HandoffPayload,
  ThoughtPayload,
  ErrorPayload,
  PROTOCOL_VERSION,
  ERROR_CODES,
} from '@/types/agentCommunicationProtocol';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a standardized ACP message
 */
export function createMessage<T = any>(
  type: MessageType,
  from: string,
  to: string | string[],
  payload: T,
  options?: {
    replyTo?: string;
    conversationId?: string;
    priority?: "low" | "normal" | "high" | "urgent";
    ttl?: number;
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
 * Create a task request message
 */
export function createTaskRequest(
  from: string,
  to: string,
  task: Omit<TaskRequestPayload, 'taskId'>
): AgentMessage<TaskRequestPayload> {
  const taskId = uuidv4();
  return createMessage(
    MessageType.TASK_REQUEST,
    from,
    to,
    { ...task, taskId }
  );
}

/**
 * Create a task completion message
 */
export function createTaskComplete(
  from: string,
  to: string,
  completion: TaskCompletePayload,
  replyTo?: string
): AgentMessage<TaskCompletePayload> {
  return createMessage(
    MessageType.TASK_COMPLETE,
    from,
    to,
    completion,
    { replyTo }
  );
}

/**
 * Create a handoff message
 */
export function createHandoff(
  from: string,
  to: string,
  handoff: HandoffPayload
): AgentMessage<HandoffPayload> {
  return createMessage(
    MessageType.HANDOFF,
    from,
    to,
    handoff
  );
}

/**
 * Create a thought/reasoning message
 */
export function createThought(
  from: string,
  to: string,
  thought: ThoughtPayload
): AgentMessage<ThoughtPayload> {
  return createMessage(
    MessageType.THOUGHT,
    from,
    to,
    thought
  );
}

/**
 * Create an error message
 */
export function createError(
  from: string,
  to: string,
  error: ErrorPayload,
  replyTo?: string
): AgentMessage<ErrorPayload> {
  return createMessage(
    MessageType.ERROR,
    from,
    to,
    error,
    { replyTo, priority: "high" }
  );
}

/**
 * Validate message format
 */
export function validateMessage(message: AgentMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.protocol?.startsWith('ACP/')) {
    errors.push('Invalid protocol identifier');
  }

  if (!message.messageType) {
    errors.push('Missing message type');
  }

  if (!message.messageId) {
    errors.push('Missing message ID');
  }

  if (!message.from) {
    errors.push('Missing sender');
  }

  if (!message.to) {
    errors.push('Missing recipient');
  }

  if (!message.timestamp) {
    errors.push('Missing timestamp');
  }

  if (message.payload === undefined) {
    errors.push('Missing payload');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if message has expired based on TTL
 */
export function isMessageExpired(message: AgentMessage): boolean {
  if (!message.ttl) return false;

  const messageTime = new Date(message.timestamp).getTime();
  const now = Date.now();
  const ttlMs = message.ttl * 1000;

  return (now - messageTime) > ttlMs;
}

/**
 * Extract conversation thread from messages
 */
export function extractThread(
  messages: AgentMessage[],
  rootMessageId: string
): AgentMessage[] {
  const thread: AgentMessage[] = [];
  const messageMap = new Map<string, AgentMessage>();

  // Build message map
  messages.forEach(msg => messageMap.set(msg.messageId, msg));

  // Find root message
  const rootMessage = messageMap.get(rootMessageId);
  if (!rootMessage) return thread;

  thread.push(rootMessage);

  // Find all replies
  let currentId = rootMessageId;
  let foundReply = true;

  while (foundReply) {
    foundReply = false;
    for (const msg of messages) {
      if (msg.replyTo === currentId && !thread.includes(msg)) {
        thread.push(msg);
        currentId = msg.messageId;
        foundReply = true;
        break;
      }
    }
  }

  return thread;
}

/**
 * Serialize message for transmission
 */
export function serializeMessage(message: AgentMessage): string {
  return JSON.stringify(message);
}

/**
 * Deserialize message from transmission
 */
export function deserializeMessage(data: string): AgentMessage {
  try {
    const message = JSON.parse(data);
    const validation = validateMessage(message);
    
    if (!validation.valid) {
      throw new Error(`Invalid message format: ${validation.errors.join(', ')}`);
    }
    
    return message;
  } catch (error) {
    throw new Error(`Failed to deserialize message: ${error}`);
  }
}

/**
 * Create a standard error response
 */
export function createStandardError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: any,
  recoverable: boolean = false
): ErrorPayload {
  return {
    code: ERROR_CODES[code],
    message,
    details,
    recoverable,
  };
}

/**
 * Calculate message size
 */
export function getMessageSize(message: AgentMessage): number {
  return new Blob([serializeMessage(message)]).size;
}

/**
 * Check protocol version compatibility
 * @param version - Protocol version string in format "ACP/X.Y.Z"
 */
export function isCompatibleVersion(version: string): boolean {
  // Extract version number after the protocol identifier (e.g., "ACP/1.0.0" -> "1.0.0")
  const versionPart = version.split('/')[1];
  if (!versionPart) return false;
  
  const [major] = versionPart.split('.') || ['0'];
  const [currentMajor] = PROTOCOL_VERSION.split('.') || ['0'];
  
  return major === currentMajor;
}

/**
 * Generate conversation ID
 */
export function generateConversationId(): string {
  return `conv_${uuidv4()}`;
}

/**
 * Format message for logging
 */
export function formatMessageForLog(message: AgentMessage): string {
  return `[${message.timestamp}] ${message.messageType}: ${message.from} -> ${message.to} (${message.messageId})`;
}

/**
 * Extract message metadata
 */
export function extractMetadata(message: AgentMessage): Record<string, any> {
  return {
    protocol: message.protocol,
    messageType: message.messageType,
    messageId: message.messageId,
    timestamp: message.timestamp,
    from: message.from,
    to: message.to,
    replyTo: message.replyTo,
    conversationId: message.conversationId,
    priority: message.priority,
    ttl: message.ttl,
  };
}

/**
 * Compare messages for equality
 */
export function messagesEqual(msg1: AgentMessage, msg2: AgentMessage): boolean {
  return msg1.messageId === msg2.messageId;
}

/**
 * Sort messages by timestamp
 */
export function sortMessagesByTime(messages: AgentMessage[]): AgentMessage[] {
  return [...messages].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

/**
 * Filter messages by criteria
 */
export function filterMessages(
  messages: AgentMessage[],
  criteria: {
    from?: string;
    to?: string;
    type?: MessageType;
    after?: Date;
    before?: Date;
  }
): AgentMessage[] {
  return messages.filter(msg => {
    if (criteria.from && msg.from !== criteria.from) return false;
    if (criteria.to && msg.to !== criteria.to && 
        (!Array.isArray(msg.to) || !msg.to.includes(criteria.to))) return false;
    if (criteria.type && msg.messageType !== criteria.type) return false;
    
    const msgTime = new Date(msg.timestamp).getTime();
    if (criteria.after && msgTime < criteria.after.getTime()) return false;
    if (criteria.before && msgTime > criteria.before.getTime()) return false;
    
    return true;
  });
}
