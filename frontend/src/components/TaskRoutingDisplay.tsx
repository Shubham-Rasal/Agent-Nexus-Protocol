'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, ArrowUpRight, BrainCircuit, RefreshCw } from 'lucide-react';
import { TaskRoutingResult, TaskSubtask } from '@/features/taskRouter/taskRouterService';

interface TaskRoutingDisplayProps {
  task: TaskRoutingResult;
  onRetry?: () => void;
}

export function TaskRoutingDisplay({ task, onRetry }: TaskRoutingDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Get a status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not-started':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get an icon for the status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'not-started':
      default:
        return <BrainCircuit className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get an agent icon based on agent type
  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'research':
        return 'R';
      case 'email-outreach':
        return 'E';
      case 'meeting-scheduler':
        return 'M';
      case 'data-analyzer':
        return 'D';
      case 'lead-qualifier':
        return 'L';
      default:
        return 'A';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Task Execution</CardTitle>
            <CardDescription>Subtask breakdown and execution status</CardDescription>
          </div>
          <Badge className={getStatusColor(task.status)}>
            {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Unknown'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Original Query</h3>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {task.originalQuery}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Task Analysis</h3>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {task.analysis}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Progress</h3>
              <div className="space-y-3">
                {['completed', 'in-progress', 'not-started', 'failed'].map(status => {
                  const count = task.subtasks.filter(st => st.status === status).length;
                  if (count === 0) return null;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm capitalize">{status}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="p-0">
            <div className="divide-y">
              {task.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                      subtask.status === 'completed' ? 'bg-green-100' :
                      subtask.status === 'in-progress' ? 'bg-blue-100' :
                      subtask.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(subtask.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">{subtask.description}</h3>
                        <Badge className={`capitalize ${getStatusColor(subtask.status)}`}>
                          {subtask.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getAgentIcon(subtask.agentType)} {subtask.agentType}
                        </Badge>
                        {subtask.dependsOn && subtask.dependsOn.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Dependencies: {subtask.dependsOn.join(', ')}
                          </Badge>
                        )}
                      </div>

                      {subtask.result && (
                        <div className="mt-3 text-sm p-2 bg-gray-50 rounded-md">
                          <div className="font-medium text-xs text-gray-500 mb-1">Result:</div>
                          <div className="whitespace-pre-wrap text-xs overflow-auto max-h-[100px]">
                            {subtask.result}
                          </div>
                        </div>
                      )}

                      {subtask.error && (
                        <div className="mt-3 text-sm p-2 bg-red-50 rounded-md">
                          <div className="font-medium text-xs text-red-500 mb-1">Error:</div>
                          <div className="text-xs text-red-700">{subtask.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="p-4">
            {task.status === 'completed' ? (
              task.finalResult ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Final Result</h3>
                  <div className="p-4 bg-white border rounded-md whitespace-pre-wrap">
                    {task.finalResult}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Tasks Completed</h3>
                  <p className="text-gray-500 mt-1">All subtasks have been processed successfully.</p>
                </div>
              )
            ) : task.status === 'failed' ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Task Failed</h3>
                <p className="text-gray-500 mt-1">{task.error || 'One or more subtasks failed to complete.'}</p>
                {onRetry && (
                  <Button 
                    onClick={onRetry} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium">Processing Task</h3>
                <p className="text-gray-500 mt-1">
                  {task.status === 'planning' ? 'Planning the execution strategy...' : 'Executing subtasks...'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {task.status === 'completed' && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Task ID: {task.taskId.substring(0, 8)}
          </div>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Task
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 