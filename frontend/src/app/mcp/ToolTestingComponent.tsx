import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { MCPServer } from '../../types/mcpTypes';

interface ToolTestingComponentProps {
  servers: MCPServer[];
  selectedServer: string;
  selectedTool: string;
  toolArguments: string;
  isLoading: boolean;
  onServerChange: (serverId: string) => void;
  onToolChange: (toolName: string) => void;
  onArgumentsChange: (args: string) => void;
  onRunTool: () => void;
}

export default function ToolTestingComponent({
  servers,
  selectedServer,
  selectedTool,
  toolArguments,
  isLoading,
  onServerChange,
  onToolChange,
  onArgumentsChange,
  onRunTool
}: ToolTestingComponentProps) {
  const selectedServerObj = servers.find(s => s.id === selectedServer);
  const selectedToolObj = selectedServerObj?.tools.find(t => t.name === selectedTool);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Test Tools</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Server</label>
          <select
            value={selectedServer}
            onChange={(e) => {
              onServerChange(e.target.value);
              onToolChange('');
            }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a server...</option>
            {servers.filter(s => s.status === 'connected' && s.tools.length > 0).map(server => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool</label>
          <select
            value={selectedTool}
            onChange={(e) => onToolChange(e.target.value)}
            disabled={!selectedServer}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="">Choose a tool...</option>
            {selectedServerObj?.tools.map(tool => (
              <option key={tool.name} value={tool.name}>{tool.name}</option>
            ))}
          </select>
        </div>

        {selectedToolObj && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arguments (JSON format)
            </label>
            <textarea
              value={toolArguments}
              onChange={(e) => onArgumentsChange(e.target.value)}
              placeholder='{"path": "/home/user/documents"}'
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm h-20"
            />
            <div className="text-xs text-gray-600 mt-2">
              {selectedToolObj.description}
            </div>
          </div>
        )}

        <button
          onClick={onRunTool}
          disabled={!selectedServer || !selectedTool || isLoading}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isLoading ? 'Running...' : 'Run Tool'}
        </button>
      </div>
    </div>
  );
}