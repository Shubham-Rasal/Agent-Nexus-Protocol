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
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Test Tools</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Select Server</label>
          <select
            value={selectedServer}
            onChange={(e) => {
              onServerChange(e.target.value);
              onToolChange('');
            }}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
          <label className="block text-sm font-medium text-foreground mb-2">Select Tool</label>
          <select
            value={selectedTool}
            onChange={(e) => onToolChange(e.target.value)}
            disabled={!selectedServer}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:bg-muted disabled:cursor-not-allowed"
          >
            <option value="">Choose a tool...</option>
            {selectedServerObj?.tools.map(tool => (
              <option key={tool.name} value={tool.name}>{tool.name}</option>
            ))}
          </select>
        </div>

        {selectedToolObj && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Arguments (JSON format)
            </label>
            <textarea
              value={toolArguments}
              onChange={(e) => onArgumentsChange(e.target.value)}
              placeholder='{"path": "/home/user/documents"}'
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-sm h-20"
            />
            <div className="text-xs text-muted-foreground mt-2">
              {selectedToolObj.description}
            </div>
          </div>
        )}

        <button
          onClick={onRunTool}
          disabled={!selectedServer || !selectedTool || isLoading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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