/**
 * Types for agent mentions functionality
 */

export interface AgentMention {
  type: 'agent';
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
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