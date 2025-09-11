import React from 'react';
import { ChevronDown, ChevronRight, Trash2, Monitor, Globe, RefreshCw } from 'lucide-react';
import { MCPServer } from '../../types/mcpTypes';

interface ServerComponentProps {
  server: MCPServer;
  isExpanded: boolean;
  isLoading: boolean;
  onToggleExpansion: (serverId: string) => void;
  onRemove: (serverId: string) => void;
}

export default function ServerComponent({
  server,
  isExpanded,
  isLoading,
  onToggleExpansion,
  onRemove
}: ServerComponentProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleExpansion(server.id)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            {server.type === 'http' ? (
              <Globe className="w-4 h-4 text-gray-500" />
            ) : (
              <Monitor className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-medium text-sm text-gray-900">{server.name}</span>
            <span className="text-xs text-gray-600">({server.type})</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 font-medium ${
            server.status === 'connected' ? 'bg-green-100 text-green-700' :
            server.status === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {isLoading && (
              <RefreshCw className="w-3 h-3 animate-spin" />
            )}
            {server.status}
          </div>
          <button
            onClick={() => onRemove(server.id)}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-xs text-gray-600 mb-3 font-mono">
            {server.type === 'http' ? (
              server.url
            ) : (
              `${server.command} ${server.args?.join(' ') || ''}`
            )}
          </div>

          {server.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
              {server.error}
            </div>
          )}

          {server.tools.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-900">Tools ({server.tools.length})</span>
              </div>
              <div className="space-y-2">
                {server.tools.map((tool) => (
                  <div key={tool.name} className="bg-white border border-gray-200 rounded-lg p-2">
                    <div className="font-medium text-sm text-gray-900">{tool.name}</div>
                    <div className="text-xs text-gray-600">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}