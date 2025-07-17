import { MCPServer, ToolCall } from '../types/mcpTypes';

export class MCPApiService {
  private static baseUrl = '/api/mcp';

  /**
   * Load all servers from the API
   */
  static async loadServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch(`${this.baseUrl}?action=list`);
      const data = await response.json();
      return data.servers || [];
    } catch (error) {
      console.error('Failed to load servers:', error);
      throw new Error('Failed to load servers');
    }
  }

  /**
   * Connect to a server
   */
  static async connectToServer(server: MCPServer): Promise<{
    success: boolean;
    server?: MCPServer;
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', server })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to connect to server ${server.name}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Connection failed');
    }
  }

  /**
   * Remove a server
   */
  static async removeServer(serverId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?serverId=${serverId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to remove server: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to remove server:', error);
      throw new Error('Failed to remove server');
    }
  }

  /**
   * Call a tool on a server
   */
  static async callTool(toolCall: {
    serverId: string;
    toolName: string;
    arguments: Record<string, any>;
  }): Promise<{
    result?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'callTool',
          toolCall
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Tool call failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Tool call failed');
    }
  }
}