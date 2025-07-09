'use client';

import { useState } from 'react';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connecting' | 'connected' | 'error';
  tools: any[];
  client?: Client;
  error?: string;
}

interface ToolCall {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: number;
}

export default function MCPServerManager() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArguments, setToolArguments] = useState<string>('{}');

  // Add a new server
  const addServer = async () => {
    if (!newServerUrl.trim() || !newServerName.trim()) return;

    const serverId = Date.now().toString();
    const newServer: MCPServer = {
      id: serverId,
      name: newServerName,
      url: newServerUrl,
      status: 'connecting',
      tools: []
    };

    setServers(prev => [...prev, newServer]);
    setNewServerUrl('');
    setNewServerName('');

    try {
      const transport = new StreamableHTTPClientTransport(new URL(newServerUrl));
      const client = new Client({ name: "MCP Server Manager", version: "1.0.0" });
      
      await client.connect(transport);
      
      // // Get server info
      // const serverInfo = await client.getServerInfo();
      // console.log(`Server ${newServer.name} info:`, serverInfo);
      
      // List available tools
      const toolsResponse = await client.listTools();
      const tools = Array.isArray(toolsResponse.tools) ? toolsResponse.tools : Object.values(toolsResponse);
      
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { ...server, status: 'connected', tools, client }
          : server
      ));
      
    } catch (error) {
      console.error(`Failed to connect to server ${newServer.name}:`, error);
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { 
              ...server, 
              status: 'error', 
              error: error instanceof Error ? error.message : String(error) 
            }
          : server
      ));
    }
  };

  // Remove a server
  const removeServer = (serverId: string) => {
    setServers(prev => prev.filter(server => server.id !== serverId));
    setToolCalls(prev => prev.filter(call => call.serverId !== serverId));
  };

  // Test a tool
  const testTool = async () => {
    if (!selectedServer || !selectedTool) return;

    const server = servers.find(s => s.id === selectedServer);
    if (!server || !server.client) return;

    let parsedArguments = {};
    try {
      parsedArguments = JSON.parse(toolArguments);
    } catch (error) {
      alert('Invalid JSON in arguments');
      return;
    }

    const callRecord: ToolCall = {
      serverId: selectedServer,
      toolName: selectedTool,
      arguments: parsedArguments,
      timestamp: Date.now()
    };

    setToolCalls(prev => [callRecord, ...prev]);

    try {
      const result = await server.client.callTool({
        name: selectedTool,
        arguments: parsedArguments
      });
      
      setToolCalls(prev => prev.map(call => 
        call.timestamp === callRecord.timestamp
          ? { ...call, result }
          : call
      ));
      
    } catch (error) {
      console.error('Tool call failed:', error);
      setToolCalls(prev => prev.map(call => 
        call.timestamp === callRecord.timestamp
          ? { ...call, error: (error instanceof Error ? error.message : String(error)) }
          : call
      ));
    }
  };

  // Get selected server and tool details
  const selectedServerObj = servers.find(s => s.id === selectedServer);
  const selectedToolObj = selectedServerObj?.tools.find(t => t.name === selectedTool);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">MCP Server Manager</h1>
      
      {/* Add Server Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New MCP Server</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Server Name</label>
            <input
              type="text"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              placeholder="e.g., Calculator Server"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Connection URL (with API key)</label>
            <input
              type="url"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              placeholder="https://server.example.com/mcp?api_key=..."
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <button
          onClick={addServer}
          disabled={!newServerUrl.trim() || !newServerName.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
        >
          Add Server
        </button>
      </div>

      {/* Connected Servers */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Connected Servers</h2>
        {servers.length === 0 ? (
          <p className="text-gray-500">No servers added yet.</p>
        ) : (
          <div className="grid gap-4">
            {servers.map((server) => (
              <div key={server.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{server.name}</h3>
                    <p className="text-sm text-gray-600">{server.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      server.status === 'connected' ? 'bg-green-100 text-green-800' :
                      server.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {server.status}
                    </span>
                    <button
                      onClick={() => removeServer(server.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {server.error && (
                  <p className="text-red-600 text-sm mb-2">Error: {server.error}</p>
                )}
                
                {server.tools.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Available Tools ({server.tools.length})</h4>
                    <div className="grid gap-2">
                      {server.tools.map((tool) => (
                        <div key={tool.name} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-sm text-gray-600">{tool.description}</div>
                          {tool.inputSchema && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">View Schema</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(tool.inputSchema, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool Testing Section */}
      {servers.some(s => s.status === 'connected' && s.tools.length > 0) && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Server</label>
              <select
                value={selectedServer}
                onChange={(e) => {
                  setSelectedServer(e.target.value);
                  setSelectedTool('');
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Choose a server...</option>
                {servers.filter(s => s.status === 'connected' && s.tools.length > 0).map(server => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                disabled={!selectedServer}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Choose a tool...</option>
                {selectedServerObj?.tools.map(tool => (
                  <option key={tool.name} value={tool.name}>{tool.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedToolObj && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Arguments (JSON format)
              </label>
              <textarea
                value={toolArguments}
                onChange={(e) => setToolArguments(e.target.value)}
                placeholder='{"expression": "2 + 2"}'
                className="w-full p-2 border rounded-md h-24 font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                Tool: {selectedToolObj.description}
              </p>
            </div>
          )}
          
          <button
            onClick={testTool}
            disabled={!selectedServer || !selectedTool}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300"
          >
            Test Tool
          </button>
        </div>
      )}

      {/* Tool Call History */}
      {toolCalls.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Tool Call History</h2>
          <div className="space-y-4">
            {toolCalls.map((call, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{call.toolName}</span>
                    <span className="text-gray-600 ml-2">
                      ({servers.find(s => s.id === call.serverId)?.name})
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mb-2">
                  <span className="text-sm font-medium">Arguments:</span>
                  <pre className="text-xs bg-white p-2 rounded border mt-1">
                    {JSON.stringify(call.arguments, null, 2)}
                  </pre>
                </div>
                
                {call.result && (
                  <div>
                    <span className="text-sm font-medium">Result:</span>
                    <pre className="text-xs bg-green-50 p-2 rounded border mt-1">
                      {JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {call.error && (
                  <div>
                    <span className="text-sm font-medium text-red-600">Error:</span>
                    <pre className="text-xs bg-red-50 p-2 rounded border mt-1 text-red-600">
                      {call.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}