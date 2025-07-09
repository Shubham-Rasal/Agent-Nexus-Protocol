'use client';

import { useEffect, useState } from 'react';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Settings, Plus, X, Play, ChevronDown, ChevronRight, Trash2, Server, Link, Activity } from 'lucide-react';

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
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

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
              error: typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message: unknown }).message)
                : String(error)
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

  // Toggle server expansion
  const toggleServerExpansion = (serverId: string) => {
    setExpandedServers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serverId)) {
        newSet.delete(serverId);
      } else {
        newSet.add(serverId);
      }
      return newSet;
    });
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
          ? { 
              ...call, 
              error: typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message: unknown }).message)
                : String(error)
            }
          : call
      ));
    }
  };

  // Get selected server and tool details
  const selectedServerObj = servers.find(s => s.id === selectedServer);
  const selectedToolObj = selectedServerObj?.tools.find(t => t.name === selectedTool);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP Server Manager</h1>
          <p className="text-gray-600">Manage Model Context Protocol servers and test their tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Server Configuration */}
          <div className="space-y-6">
            {/* Add Server Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Add New Server</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Server Name</label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Calculator Server"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Connection URL</label>
                  <input
                    type="url"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    placeholder="https://server.example.com/mcp?api_key=..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={addServer}
                  disabled={!newServerUrl.trim() || !newServerName.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Server
                </button>
              </div>
            </div>

            {/* Server List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Connected Servers ({servers.length})</h2>
              </div>
              
              {servers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No servers connected yet. Add one above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div key={server.id} className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleServerExpansion(server.id)}
                            className="text-gray-400 hover:text-gray-200"
                          >
                            {expandedServers.has(server.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm">{server.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            server.status === 'connected' ? 'bg-green-900 text-green-300' :
                            server.status === 'connecting' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {server.status}
                          </div>
                          <button
                            onClick={() => removeServer(server.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedServers.has(server.id) && (
                        <div className="border-t border-gray-600 p-4">
                          <div className="text-xs text-gray-400 mb-3">{server.url}</div>
                          
                          {server.error && (
                            <div className="bg-red-900 border border-red-800 text-red-300 px-3 py-2 rounded-lg mb-3 text-sm">
                              {server.error}
                            </div>
                          )}
                          
                          {server.tools.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium">Tools ({server.tools.length})</span>
                              </div>
                              <div className="space-y-2">
                                {server.tools.map((tool) => (
                                  <div key={tool.name} className="bg-gray-600 rounded-lg p-2">
                                    <div className="font-medium text-sm">{tool.name}</div>
                                    <div className="text-xs text-gray-400">{tool.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tool Testing and History */}
          <div className="space-y-6">
            {/* Tool Testing Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Test Tools</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Server</label>
                  <select
                    value={selectedServer}
                    onChange={(e) => {
                      setSelectedServer(e.target.value);
                      setSelectedTool('');
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a server...</option>
                    {servers.filter(s => s.status === 'connected' && s.tools.length > 0).map(server => (
                      <option key={server.id} value={server.id}>{server.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Tool</label>
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    disabled={!selectedServer}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose a tool...</option>
                    {selectedServerObj?.tools.map(tool => (
                      <option key={tool.name} value={tool.name}>{tool.name}</option>
                    ))}
                  </select>
                </div>
                
                {selectedToolObj && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Arguments (JSON format)
                    </label>
                    <textarea
                      value={toolArguments}
                      onChange={(e) => setToolArguments(e.target.value)}
                      placeholder='{"expression": "2 + 2"}'
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-20"
                    />
                    <div className="text-xs text-gray-400 mt-2">
                      {selectedToolObj.description}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={testTool}
                  disabled={!selectedServer || !selectedTool}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run Tool
                </button>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Recent Tool Calls ({toolCalls.length})</h2>
              </div>

              {toolCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tool calls yet. Test some tools above to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {toolCalls.slice(0, 10).map((call, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{call.toolName}</span>
                          <span className="text-gray-400 text-xs">
                            ({servers.find(s => s.id === call.serverId)?.name})
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="text-gray-300">Args:</span>
                          <pre className="text-xs bg-gray-600 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(call.arguments, null, 2)}
                          </pre>
                        </div>
                        
                        {call.result && (
                          <div>
                            <span className="text-green-300">Result:</span>
                            <pre className="text-xs bg-green-900 bg-opacity-30 p-2 rounded mt-1 border border-green-800 overflow-x-auto">
                              {JSON.stringify(call.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {call.error && (
                          <div>
                            <span className="text-red-300">Error:</span>
                            <pre className="text-xs bg-red-900 bg-opacity-30 p-2 rounded mt-1 border border-red-800 text-red-300 overflow-x-auto">
                              {call.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}