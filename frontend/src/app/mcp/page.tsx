'use client';

import { useEffect, useState } from 'react';
import { Settings, Plus, Server, Upload, RefreshCw, Globe, Monitor } from 'lucide-react';
import { MCPServer, ToolCall } from '../../types/mcpTypes';
import { MCPApiService } from '../../services/mcpApiService';
import ServerComponent from './ServerComponent';
import ToolTestingComponent from './ToolTestingComponent';
import ToolHistoryComponent from './ToolHistoryComponent';

export default function MCPServerManager() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [serverType, setServerType] = useState<'http' | 'local'>('http');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [jsonConfig, setJsonConfig] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArguments, setToolArguments] = useState<string>('{}');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  // Load servers from API
  const loadServers = async () => {
    try {
      const loadedServers = await MCPApiService.loadServers();
      setServers(loadedServers);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  // Parse JSON config for local servers
  const parseJsonConfig = (jsonString: string) => {
    try {
      const config = JSON.parse(jsonString);
      if (config.mcpServers) {
        return Object.entries(config.mcpServers).map(([key, serverConfig]: [string, any]) => ({
          name: key,
          command: serverConfig.command || '',
          args: serverConfig.args || [],
          env: serverConfig.env || {},
          workingDirectory: serverConfig.cwd || ''
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // Connect to server via API
  const connectToServer = async (server: MCPServer) => {
    setLoading(prev => ({ ...prev, [server.id]: true }));

    try {
      const result = await MCPApiService.connectToServer(server);

      if (result.success) {
        setServers(prev => prev.map(s =>
          s.id === server.id ? result.server! : s
        ));
      } else {
        setServers(prev => prev.map(s =>
          s.id === server.id
            ? { ...s, status: 'error', error: result.error }
            : s
        ));
      }
    } catch (error) {
      setServers(prev => prev.map(s =>
        s.id === server.id
          ? {
            ...s,
            status: 'error',
            error: error instanceof Error ? error.message : 'Connection failed'
          }
          : s
      ));
    } finally {
      setLoading(prev => ({ ...prev, [server.id]: false }));
    }
  };

  // Add HTTP server
  const addHttpServer = async () => {
    if (!newServerUrl.trim() || !newServerName.trim()) return;

    const serverId = Date.now().toString();
    const newServer: MCPServer = {
      id: serverId,
      name: newServerName,
      type: 'http',
      url: newServerUrl,
      status: 'connecting',
      tools: []
    };

    setServers(prev => [...prev, newServer]);
    setNewServerUrl('');
    setNewServerName('');

    await connectToServer(newServer);
  };

  // Add local servers from JSON config
  const addLocalServersFromJson = async () => {
    if (!jsonConfig.trim()) return;

    try {
      const configs = parseJsonConfig(jsonConfig);

      for (const config of configs) {
        const serverId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newServer: MCPServer = {
          id: serverId,
          name: config.name,
          type: 'local',
          command: config.command,
          args: config.args,
          env: config.env,
          workingDirectory: config.workingDirectory,
          status: 'connecting',
          tools: []
        };

        setServers(prev => [...prev, newServer]);

        // Connect to server (with slight delay to avoid overwhelming)
        setTimeout(() => connectToServer(newServer), configs.indexOf(config) * 100);
      }

      setJsonConfig('');

    } catch (error) {
      alert('Invalid JSON configuration. Please check the format.');
    }
  };

  // Remove a server
  const removeServer = async (serverId: string) => {
    try {
      await MCPApiService.removeServer(serverId);
      setServers(prev => prev.filter(server => server.id !== serverId));
      setToolCalls(prev => prev.filter(call => call.serverId !== serverId));
    } catch (error) {
      console.error('Failed to remove server:', error);
    }
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
    setLoading(prev => ({ ...prev, toolCall: true }));

    try {
      const result = await MCPApiService.callTool({
        serverId: selectedServer,
        toolName: selectedTool,
        arguments: parsedArguments
      });

      if (result.result) {
        setToolCalls(prev => prev.map(call =>
          call.timestamp === callRecord.timestamp
            ? { ...call, result: result.result }
            : call
        ));
      } else {
        setToolCalls(prev => prev.map(call =>
          call.timestamp === callRecord.timestamp
            ? { ...call, error: result.error || 'Unknown error' }
            : call
        ));
      }

    } catch (error) {
      setToolCalls(prev => prev.map(call =>
        call.timestamp === callRecord.timestamp
          ? {
            ...call,
            error: error instanceof Error ? error.message : 'Tool call failed'
          }
          : call
      ));
    } finally {
      setLoading(prev => ({ ...prev, toolCall: false }));
    }
  };

  // Refresh server list
  const refreshServers = async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    await loadServers();
    setLoading(prev => ({ ...prev, refresh: false }));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MCP Server Manager
          </h1>
          <p className="text-gray-600 mb-4">
            Manage Model Context Protocol servers and test their tools
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Server Configuration */}
          <div className="space-y-6">
            {/* Add Server Section */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900">Add New Server</h2>
              </div>

              <div className="space-y-4">
                {/* Server Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Server Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setServerType('http')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${serverType === 'http'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400'
                        }`}
                    >
                      <Globe className="w-4 h-4" />
                      HTTP Server
                    </button>
                    <button
                      onClick={() => setServerType('local')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${serverType === 'local'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400'
                        }`}
                    >
                      <Monitor className="w-4 h-4" />
                      Local Server
                    </button>
                  </div>
                </div>

                {/* HTTP Server Configuration */}
                {serverType === 'http' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Server Name</label>
                      <input
                        type="text"
                        value={newServerName}
                        onChange={(e) => setNewServerName(e.target.value)}
                        placeholder="Calculator Server"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Connection URL</label>
                      <input
                        type="url"
                        value={newServerUrl}
                        onChange={(e) => setNewServerUrl(e.target.value)}
                        placeholder="https://server.example.com/mcp"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={addHttpServer}
                      disabled={!newServerName.trim() || !newServerUrl.trim()}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add HTTP Server
                    </button>
                  </>
                )}

                {/* Local Server Configuration */}
                {serverType === 'local' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MCP Servers JSON Configuration
                      </label>
                      <textarea
                        value={jsonConfig}
                        onChange={(e) => setJsonConfig(e.target.value)}
                        placeholder={`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}`}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-64 resize-y"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Paste your complete MCP servers JSON configuration
                      </p>
                    </div>
                    <button
                      onClick={addLocalServersFromJson}
                      disabled={!jsonConfig.trim()}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Add Local Servers
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Server List */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-medium text-gray-900">Connected Servers ({servers.length})</h2>
                </div>
                <button
                  onClick={refreshServers}
                  disabled={loading.refresh}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400"
                >
                  <RefreshCw className={`w-4 h-4 ${loading.refresh ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {servers.length === 0 ? (
                <div className="text-center py-8 text-gray-100">
                  <Server className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-500">No servers connected yet. Add one above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3 bg-white">
                  {servers.map((server) => (
                    <ServerComponent
                      key={server.id}
                      server={server}
                      isExpanded={expandedServers.has(server.id)}
                      isLoading={loading[server.id] || false}
                      onToggleExpansion={toggleServerExpansion}
                      onRemove={removeServer}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tool Testing and History */}
          <div className="space-y-6 bg-white">
            <ToolTestingComponent
              servers={servers}
              selectedServer={selectedServer}
              selectedTool={selectedTool}
              toolArguments={toolArguments}
              isLoading={loading.toolCall || false}
              onServerChange={setSelectedServer}
              onToolChange={setSelectedTool}
              onArgumentsChange={setToolArguments}
              onRunTool={testTool}
            />

            <ToolHistoryComponent
              toolCalls={toolCalls}
              servers={servers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}