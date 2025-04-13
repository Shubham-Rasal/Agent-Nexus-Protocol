/**
 * Shared type definitions for chat components
 */

/**
 * Message type for agent conversations
 */
export type Message = {
  id: string;
  role: 'user' | 'agent' | 'router' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  isLoading?: boolean;
  isThought?: boolean;
  storachaItemId?: string; // Link to a Storacha item
};

/**
 * Agent information type
 */
export type AgentInfo = {
  id: string;
  name: string;
  description: string;
  knowledge_sources?: string[];
  tools?: string[];
  stake: number;
  privacy_level: string;
};

/**
 * SubTask type for multi-agent workflows
 */
export type SubTask = {
  id: string;
  description: string;
  agent: AgentInfo;
  status: 'pending' | 'in-progress' | 'completed';
  response?: string;
  thoughtProcess?: string;
};

/**
 * Type for stored chat sessions
 */
export type ChatSession = {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  activeTasks: SubTask[];
};

/**
 * Type for storage operations
 */
export type StorachaOperation = {
  id: string;
  operation: 'upload' | 'download' | 'list' | 'share' | 'info' | 'delegation';
  agentId: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp: Date;
  dataType?: string;
  messageId?: string; // Link to a message
}; 