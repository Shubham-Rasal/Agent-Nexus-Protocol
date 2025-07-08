"use client";

import React, { useState, useCallback } from 'react';
import { Send, Server, Database, AlertCircle, CheckCircle, Wrench } from 'lucide-react';

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface ServerConnection {
  url: string;
  connected: boolean;
  tools: MCPTool[];
  resources: MCPResource[];
}

const MCPClient: React.FC = () => {
  const [servers, setServers] = useState<{ [key: string]: ServerConnection }>({});
  const [newServerUrl, setNewServerUrl] = useState('');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const connectToServer = async (url: string) => {
    setLoading(true);
    addLog(`Attempting to connect to ${url}`);
    
    try {
      // Initialize connection
      const initRequest: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}
          },
          clientInfo: {
            name: 'Basic MCP Client',
            version: '1.0.0'
          }
        }
      };

      // In a real implementation, you'd use WebSocket or HTTP transport
      // For demo purposes, we'll simulate the connection
      const mockResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: initRequest.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: true },
            resources: { listChanged: true }
          },
          serverInfo: {
            name: 'Mock MCP Server',
            version: '1.0.0'
          }
        }
      };

      // Get available tools
      const toolsRequest: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now() + 1,
        method: 'tools/list'
      };

      const mockTools: MCPTool[] = [
        {
          name: 'echo',
          description: 'Echo back the input text',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to echo' }
            },
            required: ['text']
          }
        },
        {
          name: 'add',
          description: 'Add two numbers together',
          inputSchema: {
            type: 'object',
            properties: {
              a: { type: 'number', description: 'First number' },
              b: { type: 'number', description: 'Second number' }
            },
            required: ['a', 'b']
          }
        }
      ];

      // Get available resources
      const resourcesRequest: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now() + 2,
        method: 'resources/list'
      };

      const mockResources: MCPResource[] = [
        {
          uri: 'file:///example.txt',
          name: 'Example File',
          description: 'An example text file',
          mimeType: 'text/plain'
        }
      ];

      setServers(prev => ({
        ...prev,
        [url]: {
          url,
          connected: true,
          tools: mockTools,
          resources: mockResources
        }
      }));

      addLog(`Successfully connected to ${url}`);
      addLog(`Found ${mockTools.length} tools and ${mockResources.length} resources`);
      
      if (!selectedServer) {
        setSelectedServer(url);
      }
    } catch (error) {
      addLog(`Failed to connect to ${url}: ${error}`);
      setServers(prev => ({
        ...prev,
        [url]: {
          url,
          connected: false,
          tools: [],
          resources: []
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const callTool = async () => {
    if (!selectedServer || !selectedTool) return;

    setLoading(true);
    addLog(`Calling tool: ${selectedTool}`);

    try {
      const params = JSON.parse(toolParams);
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments: params
        }
      };

      // Mock tool execution
      let result: any;
      if (selectedTool === 'echo') {
        result = { text: params.text };
      } else if (selectedTool === 'add') {
        result = { sum: params.a + params.b };
      } else {
        result = { message: 'Tool executed successfully' };
      }

      const mockResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };

      setResponse(JSON.stringify(mockResponse.result, null, 2));
      addLog(`Tool call successful: ${selectedTool}`);
    } catch (error) {
      addLog(`Tool call failed: ${error}`);
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = () => {
    if (newServerUrl.trim()) {
      connectToServer(newServerUrl.trim());
      setNewServerUrl('');
    }
  };

  const currentServer = selectedServer ? servers[selectedServer] : null;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP Client</h1>
        <p className="text-gray-600">Connect to MCP servers and interact with their tools and resources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Connection Panel */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Server Connections
          </h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              placeholder="ws://localhost:8080/mcp"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddServer}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Connect
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(servers).map(([url, server]) => (
              <div
                key={url}
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedServer === url
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedServer(url)}
              >
                <div className="flex items-center gap-2">
                  {server.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">{url}</span>
                </div>
                {server.connected && (
                  <div className="text-sm text-gray-600 mt-1">
                    {server.tools.length} tools, {server.resources.length} resources
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tool Interaction Panel */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Tool Execution
          </h2>

          {currentServer?.connected ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tool
                </label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a tool...</option>
                  {currentServer.tools.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name} - {tool.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Parameters (JSON)
                </label>
                <textarea
                  value={toolParams}
                  onChange={(e) => setToolParams(e.target.value)}
                  placeholder='{"text": "Hello, world!"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 font-mono text-sm"
                />
              </div>

              <button
                onClick={callTool}
                disabled={loading || !selectedTool}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Executing...' : 'Execute Tool'}
              </button>

              {response && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response
                  </label>
                  <pre className="bg-white p-3 rounded-md border border-gray-300 text-sm overflow-auto max-h-40">
                    {response}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Connect to a server to access tools</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-48 overflow-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No activity yet...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPClient;