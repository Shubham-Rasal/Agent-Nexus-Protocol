'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, FileSpreadsheet, Calendar, BarChart2, Wrench } from 'lucide-react';
import { Tool } from '@/features/leadflow/tools/schema';
import { formatProviderName } from '@/components/WorkflowUtils';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard = ({ tool }: ToolCardProps) => {
  // Get the appropriate icon based on category
  const getIcon = () => {
    switch (tool.category) {
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sheets': return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'calendar': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'analysis': return <BarChart2 className="h-4 w-4 text-purple-500" />;
      default: return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            tool.category === 'email' ? 'bg-blue-100' :
            tool.category === 'sheets' ? 'bg-green-100' :
            tool.category === 'calendar' ? 'bg-orange-100' :
            tool.category === 'analysis' ? 'bg-purple-100' :
            'bg-gray-100'
          }`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{tool.name}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{tool.description}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge 
            variant={tool.requiresAuth ? "warning" : "success"} 
            className="text-xs px-2 py-0"
          >
            {formatProviderName(tool.provider)}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0">
            {tool.parameters.length} param{tool.parameters.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolCard; 