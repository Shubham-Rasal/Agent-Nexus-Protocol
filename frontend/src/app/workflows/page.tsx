'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PRESET_WORKFLOWS } from '@/features/workflows/presets';
import { Workflow } from '@/features/workflows/registry/types';
import { WorkflowViewer } from '@/components/WorkflowViewer';

export default function WorkflowsPage() {
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-[350px_1fr]">
      {/* Sidebar with workflow list */}
      <div className="border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-gray-500">View available automation workflows</p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-4 p-4 pt-0">
            {PRESET_WORKFLOWS.map(workflow => (
              <Card 
                key={workflow.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedWorkflow?.id === workflow.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="mt-1">{workflow.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {workflow.domains.map((domain, index) => (
                        <Badge key={index} variant="secondary">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {workflow.capabilities.map((capability, index) => (
                        <Badge key={index} variant="outline">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Version:</span>
                      <span className="font-medium">{workflow.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Author:</span>
                      <span className="font-medium">{workflow.author}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content area with workflow viewer */}
      <div className="overflow-hidden">
        {selectedWorkflow ? (
          <WorkflowViewer workflow={selectedWorkflow} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a workflow to view its details
          </div>
        )}
      </div>
    </div>
  );
} 