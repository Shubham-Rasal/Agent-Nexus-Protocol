import React from 'react';
import { Activity } from 'lucide-react';
import { ToolCall, MCPServer } from '../../types/mcpTypes';

interface ToolHistoryComponentProps {
  toolCalls: ToolCall[];
  servers: MCPServer[];
}

export default function ToolHistoryComponent({ toolCalls, servers }: ToolHistoryComponentProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Tool Calls ({toolCalls.length})</h2>
      </div>

      {toolCalls.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No tool calls yet. Test some tools above to see results here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {toolCalls.slice(0, 10).map((call, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{call.toolName}</span>
                  <span className="text-gray-600 text-xs">
                    ({servers.find(s => s.id === call.serverId)?.name})
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(call.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-gray-700 font-medium">Args:</span>
                  <pre className="text-xs bg-white border border-gray-200 p-2 rounded mt-1 overflow-x-auto text-gray-800">
                    {JSON.stringify(call.arguments, null, 2)}
                  </pre>
                </div>

                {call.result && (
                  <div>
                    <span className="text-green-700 font-medium">Result:</span>
                    <pre className="text-xs bg-green-50 border border-green-200 p-2 rounded mt-1 overflow-x-auto text-green-800">
                      {JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                )}

                {call.error && (
                  <div>
                    <span className="text-red-700 font-medium">Error:</span>
                    <pre className="text-xs bg-red-50 border border-red-200 p-2 rounded mt-1 text-red-800 overflow-x-auto">
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