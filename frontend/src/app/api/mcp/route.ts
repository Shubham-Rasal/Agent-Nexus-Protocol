// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

interface MCPServer {
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

// In-memory storage for server connections (in production, use Redis or similar)
const serverConnections = new Map<string, Client>();
const serverConfigs = new Map<string, MCPServer>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const serverId = url.searchParams.get('serverId');

  try {
    if (action === 'list') {
      const servers = Array.from(serverConfigs.values());
      return NextResponse.json({ servers });
    }

    if (action === 'tools' && serverId) {
      const client = serverConnections.get(serverId);
      if (!client) {
        return NextResponse.json({ error: 'Server not connected' }, { status: 404 });
      }

      const toolsResponse = await client.listTools();
      return NextResponse.json({ tools: toolsResponse.tools || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, server, toolCall } = body;

  try {
    if (action === 'connect') {
      const serverId = server.id;
      let client: Client;
      let transport: any;

      if (server.type === 'http') {
        transport = new StreamableHTTPClientTransport(new URL(server.url));
      } else {
        transport = new StdioClientTransport({
          command: server.command,
          args: server.args || [],
          env: {
            ...process.env,
            ...server.env
          },
          cwd: server.workingDirectory || process.cwd()
        });
      }

      client = new Client({
        name: "MCP Server Manager",
        version: "1.0.0"
      });

      await client.connect(transport);

      // Get tools
      const toolsResponse = await client.listTools();
      const tools = Array.isArray(toolsResponse.tools) ? toolsResponse.tools : [];

      // Store connection and config
      serverConnections.set(serverId, client);
      serverConfigs.set(serverId, {
        ...server,
        status: 'connected',
        tools,
        error: undefined
      });

      return NextResponse.json({ 
        success: true, 
        server: { ...server, status: 'connected', tools } 
      });

    } else if (action === 'disconnect') {
      const serverId = server.id;
      const client = serverConnections.get(serverId);
      
      if (client) {
        try {
          await client.close();
        } catch (error) {
          console.error('Error closing client:', error);
        }
        serverConnections.delete(serverId);
      }
      
      serverConfigs.delete(serverId);
      
      return NextResponse.json({ success: true });

    } else if (action === 'callTool') {
      const client = serverConnections.get(toolCall.serverId);
      if (!client) {
        return NextResponse.json({ error: 'Server not connected' }, { status: 404 });
      }

      const result = await client.callTool({
        name: toolCall.toolName,
        arguments: toolCall.arguments
      });

      return NextResponse.json({ result });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('MCP API Error:', error);
    
    if (body.action === 'connect') {
      // Update server status to error
      const serverId = body.server.id;
      serverConfigs.set(serverId, {
        ...body.server,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        tools: []
      });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const serverId = url.searchParams.get('serverId');

  if (!serverId) {
    return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
  }

  try {
    const client = serverConnections.get(serverId);
    if (client) {
      await client.close();
      serverConnections.delete(serverId);
    }
    
    serverConfigs.delete(serverId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}