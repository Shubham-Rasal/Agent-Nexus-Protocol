'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit } from 'lucide-react';
import { Agent } from '@/features/agents/schema';

interface AgentCardProps {
  agent: Agent;
  showTools?: boolean;
}

const AgentCard = ({ agent, showTools = false }: AgentCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-sm">{agent.name}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{agent.description}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className="text-xs px-2 py-0">
            {agent.model}
          </Badge>
          {agent.tools.length > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {agent.tools.length} skill{agent.tools.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {showTools && agent.tools.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <div className="text-xs text-gray-500 mb-1">Agent Skills:</div>
            <div className="flex flex-wrap gap-1">
              {/* {agent.tools.map(toolId => (
                <Badge key={toolId} variant="outline" className="text-xs">
                  {toolId}
                </Badge>
              ))} */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentCard; 