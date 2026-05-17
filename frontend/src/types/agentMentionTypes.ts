/**
 * Types for agent mentions functionality
 */

export interface AgentService {
  name: string;
  description?: string;
  endpoint?: string;
  protocol?: string;
  type?: string;
  cost?: string;
  currency?: string;
  inputSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
}

export interface AgentMention {
  type: 'agent';
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  agentURI?: string;
  tools?: string[];
  knowledge_sources?: string[];
  services?: AgentService[];
}

export interface AgentMentionItem extends AgentMention {
  label: string;
}

export interface MentionInputProps {
  input?: string;
  onChange?: (value: string) => void;
  onChangeMention?: (mentionItems: AgentMention[]) => void;
  onEnter?: () => void;
  placeholder?: string;
  agents?: AgentMention[];
  className?: string;
}

export interface MentionSuggestion {
  top: number;
  left: number;
  query: string;
  selectedIndex: number;
  command: (item: { id: string; label: string }) => void;
}