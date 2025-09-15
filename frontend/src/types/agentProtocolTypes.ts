export type MessageType = 'Propose' | 'Result' | 'Error';

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string;
  to: string;
  timestamp: string;
  payload: ProposePayload | ResultPayload | ErrorPayload;
}

export interface ProposePayload {
  task: string;
  language: string;
  description: string;
}

export interface ResultPayload {
  status: 'success' | 'error';
  code?: string;
  error?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface AgentDescriptor {
  id: string;
  role: string;
  capabilities: string[];
  protocols: string[];
}

export const AGENT_PROTOCOL = '/agent-protocol/v1';
