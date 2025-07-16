export interface MCPServer {
  id: string;
  name: string;
  type: 'http' | 'local';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
  status: 'connecting' | 'connected' | 'error';
  tools: any[];
  error?: string;
}

export interface ToolCall {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: number;
}