import React from 'react';
import { Activity } from 'lucide-react';
import { ToolCall, MCPServer } from '../../types/mcpTypes';

interface ToolHistoryComponentProps {
  toolCalls: ToolCall[];
  servers: MCPServer[];
}

export default function ToolHistoryComponent({ toolCalls, servers }: ToolHistoryComponentProps) {
  return (
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
  );
}