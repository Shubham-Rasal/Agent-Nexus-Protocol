import React from 'react';
import { Activity } from 'lucide-react';
import { ToolCall, MCPServer } from '../../types/mcpTypes';

interface ToolHistoryComponentProps {
  toolCalls: ToolCall[];
  servers: MCPServer[];
}

export default function ToolHistoryComponent({ toolCalls, servers }: ToolHistoryComponentProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Recent Tool Calls ({toolCalls.length})</h2>
      </div>

      {toolCalls.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No tool calls yet. Test some tools above to see results here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {toolCalls.slice(0, 10).map((call, index) => (
            <div key={index} className="bg-muted/50 border border-border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{call.toolName}</span>
                  <span className="text-muted-foreground text-xs">
                    ({servers.find(s => s.id === call.serverId)?.name})
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(call.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-foreground">Args:</span>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto text-foreground">
                    {JSON.stringify(call.arguments, null, 2)}
                  </pre>
                </div>

                {call.result && (
                  <div>
                    <span className="text-green-600">Result:</span>
                    <pre className="text-xs bg-green-50 border border-green-200 p-2 rounded mt-1 overflow-x-auto text-green-800">
                      {JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                )}

                {call.error && (
                  <div>
                    <span className="text-red-600">Error:</span>
                    <pre className="text-xs bg-red-50 border border-red-200 p-2 rounded mt-1 overflow-x-auto text-red-800">
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