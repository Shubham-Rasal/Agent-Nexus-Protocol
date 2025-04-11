export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  storageProvider: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
  systemPrompt?: string;
  parameters?: Record<string, any>;
}

export const AGENT_MODELS = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku' }
];

export const STORAGE_PROVIDERS = [
  { id: 'local', name: 'Local Storage' },
  { id: 'mongodb', name: 'MongoDB' },
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'redis', name: 'Redis' },
  { id: 'pinecone', name: 'Pinecone' }
]; 