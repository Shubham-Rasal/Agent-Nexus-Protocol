'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  ActivitySquare, 
  AlignJustify, 
  BarChart2, 
  GitBranch, 
  Wand2, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp,
  Play,
  Pause,
  StopCircle,
  Clock,
  Zap,
  Info,
  Layers
} from 'lucide-react';

import { Workflow } from '@/features/workflows/registry/types';
import { workflowEngine } from '@/features/workflows/engine/engine';
import { ExecutionState, ExecutionStatus, NodeExecutionState } from '@/features/workflows/engine/types';
import { SubTask } from '@/features/workflows/router/types';

type EnhancedWorkflowPanelProps = {
  workflowId?: string;
  chatId?: string;
  tasks?: SubTask[];
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
};

export function EnhancedWorkflowPanel({ 
  workflowId,
  chatId,
  tasks = [], 
  open, 
  onOpenChange, 
  onClose 
}: EnhancedWorkflowPanelProps) {
  const [activeTab, setActiveTab] = useState('workflow');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  
  // Load execution state when component mounts or when workflow/chat IDs change
  useEffect(() => {
    if (workflowId && chatId) {
      const state = workflowEngine.getExecutionState(workflowId, chatId);
      setExecutionState(state || null);
    }
  }, [workflowId, chatId]);
  
  // Poll for execution state updates
  useEffect(() => {
    if (!workflowId || !chatId) return;
    
    const interval = setInterval(() => {
      const state = workflowEngine.getExecutionState(workflowId, chatId);
      setExecutionState(state || null);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [workflowId, chatId]);
  
  // Function to handle closing or changing open state
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (!newOpen && onClose) {
      onClose();
    }
  };
  
  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  // Handle workflow execution control
  const handlePauseWorkflow = async () => {
    if (workflowId && chatId) {
      await workflowEngine.pauseExecution(workflowId, chatId);
    }
  };
  
  const handleResumeWorkflow = async () => {
    if (workflowId && chatId && executionState) {
      await workflowEngine.continueExecution(workflowId, chatId);
    }
  };
  
  const handleStopWorkflow = async () => {
    if (workflowId && chatId) {
      await workflowEngine.stopExecution(workflowId, chatId);
    }
  };
  
  // Get workflow progress
  const getProgressPercentage = () => {
    if (!executionState) return 0;
    
    const nodeStates = Object.values(executionState.nodeStates);
    if (nodeStates.length === 0) return 0;
    
    const completedNodes = nodeStates.filter(
      ns => ns.status === ExecutionStatus.COMPLETED
    ).length;
    
    return Math.round((completedNodes / nodeStates.length) * 100);
  };
  
  // Format workflow duration
  const getWorkflowDuration = () => {
    if (!executionState || !executionState.startTime) return 'Not started';
    
    const start = new Date(executionState.startTime);
    const end = executionState.endTime ? new Date(executionState.endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    // Format as MM:SS or HH:MM:SS
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Classify node states by status
  const nodeStatesByStatus = executionState ? {
    idle: Object.values(executionState.nodeStates).filter(ns => ns.status === ExecutionStatus.IDLE),
    running: Object.values(executionState.nodeStates).filter(ns => ns.status === ExecutionStatus.RUNNING),
    completed: Object.values(executionState.nodeStates).filter(ns => ns.status === ExecutionStatus.COMPLETED),
    error: Object.values(executionState.nodeStates).filter(ns => ns.status === ExecutionStatus.ERROR),
  } : {
    idle: [],
    running: [],
    completed: [],
    error: []
  };
  
  // Count tasks by status for the Tasks view
  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };
  
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        test
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto border-l border-gray-200">
        <SheetHeader className="mb-5">
          <SheetTitle className="flex items-center">
            <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
            Workflow Engine
            {executionState && (
              <Badge 
                className="ml-3"
                variant={
                  executionState.status === ExecutionStatus.RUNNING ? 'info' :
                  executionState.status === ExecutionStatus.COMPLETED ? 'success' :
                  executionState.status === ExecutionStatus.ERROR ? 'destructive' :
                  executionState.status === ExecutionStatus.PAUSED ? 'warning' :
                  'secondary'
                }
              >
                {executionState.status}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100">
            <TabsTrigger value="workflow" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700">
              <GitBranch className="h-4 w-4" />
              <span>Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5">
              <AlignJustify className="h-4 w-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflow" className="mt-4 space-y-5">
            {executionState ? (
              <>
                {/* Workflow Controls */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Workflow Execution</h3>
                  
                  <div className="flex space-x-2">
                    {executionState.status === ExecutionStatus.RUNNING && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handlePauseWorkflow}
                        className="flex items-center gap-1 h-8"
                      >
                        <Pause className="h-4 w-4" />
                        <span>Pause</span>
                      </Button>
                    )}
                    
                    {executionState.status === ExecutionStatus.PAUSED && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleResumeWorkflow}
                        className="flex items-center gap-1 h-8"
                      >
                        <Play className="h-4 w-4" />
                        <span>Resume</span>
                      </Button>
                    )}
                    
                    {(executionState.status === ExecutionStatus.RUNNING || executionState.status === ExecutionStatus.PAUSED) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleStopWorkflow}
                        className="flex items-center gap-1 h-8"
                      >
                        <StopCircle className="h-4 w-4" />
                        <span>Stop</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Workflow Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={getProgressPercentage()} className="h-2" />
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{getWorkflowDuration()}</span>
                      </div>
                      <span>{getProgressPercentage()}% complete</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Node Execution States */}
                <div className="space-y-3">
                  {/* Currently Executing Nodes */}
                  {nodeStatesByStatus.running.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Executing</h3>
                      {nodeStatesByStatus.running.map(nodeState => (
                        <NodeStateCard 
                          key={nodeState.nodeId}
                          nodeState={nodeState}
                          isExpanded={!!expandedNodes[nodeState.nodeId]}
                          onToggleExpand={() => toggleNodeExpansion(nodeState.nodeId)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Completed Nodes */}
                  {nodeStatesByStatus.completed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Completed</h3>
                      {nodeStatesByStatus.completed.map(nodeState => (
                        <NodeStateCard 
                          key={nodeState.nodeId}
                          nodeState={nodeState}
                          isExpanded={!!expandedNodes[nodeState.nodeId]}
                          onToggleExpand={() => toggleNodeExpansion(nodeState.nodeId)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Error Nodes */}
                  {nodeStatesByStatus.error.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Errors</h3>
                      {nodeStatesByStatus.error.map(nodeState => (
                        <NodeStateCard 
                          key={nodeState.nodeId}
                          nodeState={nodeState}
                          isExpanded={!!expandedNodes[nodeState.nodeId]}
                          onToggleExpand={() => toggleNodeExpansion(nodeState.nodeId)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Pending Nodes */}
                  {nodeStatesByStatus.idle.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Pending</h3>
                      {nodeStatesByStatus.idle.map(nodeState => (
                        <NodeStateCard 
                          key={nodeState.nodeId}
                          nodeState={nodeState}
                          isExpanded={!!expandedNodes[nodeState.nodeId]}
                          onToggleExpand={() => toggleNodeExpansion(nodeState.nodeId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <ActivitySquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">No active workflow.</p>
                <p className="text-xs mt-1">Start a new chat with a workflow to see execution details.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              {tasks.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Agent Tasks</h3>
                    
                    <div className="flex space-x-2">
                      {taskCounts.pending > 0 && (
                        <Badge variant="secondary">{taskCounts.pending} Pending</Badge>
                      )}
                      {taskCounts.inProgress > 0 && (
                        <Badge variant="info">{taskCounts.inProgress} Working</Badge>
                      )}
                      {taskCounts.completed > 0 && (
                        <Badge variant="success">{taskCounts.completed} Done</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <Card key={task.id} className="overflow-hidden">
                        <CardHeader className="p-3 pb-2 bg-gray-50 border-b">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="truncate">{task.description}</span>
                            <Badge 
                              variant={
                                task.status === 'completed' ? 'success' : 
                                task.status === 'in_progress' ? 'info' : 
                                task.status === 'failed' ? 'destructive' :
                                'secondary'
                              }
                              className="ml-2"
                            >
                              {task.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs">
                          <div className="flex justify-between text-gray-500 mb-2">
                            <span>Agent: {task.agentId}</span>
                            <span>Confidence: {Math.round(task.confidence * 100)}%</span>
                          </div>
                          
                          {task.result && (
                            <div className="mt-2 bg-gray-50 p-2 rounded border text-gray-700">
                              <strong className="block mb-1">Result:</strong>
                              <p className="whitespace-pre-wrap">{task.result}</p>
                            </div>
                          )}
                          
                          {task.error && (
                            <div className="mt-2 bg-red-50 p-2 rounded border border-red-100 text-red-700">
                              <strong className="block mb-1">Error:</strong>
                              <p>{task.error}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-sm">No tasks currently active.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <div className="space-y-4">
              {/* Task Statistics */}
              {tasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Task Execution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Pending</span>
                        <span>{taskCounts.pending} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full" 
                          style={{ width: `${tasks.length ? (taskCounts.pending / tasks.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>In Progress</span>
                        <span>{taskCounts.inProgress} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${tasks.length ? (taskCounts.inProgress / tasks.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Completed</span>
                        <span>{taskCounts.completed} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${tasks.length ? (taskCounts.completed / tasks.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Failed</span>
                        <span>{taskCounts.failed} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${tasks.length ? (taskCounts.failed / tasks.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Workflow Statistics */}
              {executionState && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Workflow Execution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Duration:</span>
                      </div>
                      <span className="font-medium">{getWorkflowDuration()}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-md p-2 border">
                        <span className="text-xs text-gray-500 block mb-1">Nodes</span>
                        <span className="text-lg font-semibold">
                          {Object.keys(executionState.nodeStates).length}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 border">
                        <span className="text-xs text-gray-500 block mb-1">Variables</span>
                        <span className="text-lg font-semibold">
                          {Object.keys(executionState.variables).length}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 border">
                        <span className="text-xs text-gray-500 block mb-1">Completed</span>
                        <span className="text-lg font-semibold text-green-600">
                          {nodeStatesByStatus.completed.length}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 border">
                        <span className="text-xs text-gray-500 block mb-1">Errors</span>
                        <span className="text-lg font-semibold text-red-600">
                          {nodeStatesByStatus.error.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

interface NodeStateCardProps {
  nodeState: NodeExecutionState;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function NodeStateCard({ nodeState, isExpanded, onToggleExpand }: NodeStateCardProps) {
  // Extract node ID and node type from the ID
  const nodeIdParts = nodeState.nodeId.split('_');
  const nodeType = nodeIdParts[0] || 'node';
  const shortId = nodeIdParts.length > 1 ? nodeIdParts[1].substring(0, 4) : nodeState.nodeId.substring(0, 4);
  
  return (
    <Card className="overflow-hidden mb-2">
      <CardHeader 
        className={`p-3 cursor-pointer ${
          nodeState.status === ExecutionStatus.RUNNING ? 'bg-blue-50' :
          nodeState.status === ExecutionStatus.COMPLETED ? 'bg-green-50' :
          nodeState.status === ExecutionStatus.ERROR ? 'bg-red-50' :
          'bg-gray-50'
        }`}
        onClick={onToggleExpand}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {nodeState.status === ExecutionStatus.RUNNING ? (
              <Zap className="h-4 w-4 text-blue-500" />
            ) : nodeState.status === ExecutionStatus.COMPLETED ? (
              <BrainCircuit className="h-4 w-4 text-green-600" />
            ) : nodeState.status === ExecutionStatus.ERROR ? (
              <Info className="h-4 w-4 text-red-500" />
            ) : (
              <Layers className="h-4 w-4 text-gray-500" />
            )}
            <span>
              {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node
              <span className="text-xs text-gray-500 ml-1">({shortId})</span>
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Badge 
              variant={
                nodeState.status === ExecutionStatus.RUNNING ? 'info' :
                nodeState.status === ExecutionStatus.COMPLETED ? 'success' :
                nodeState.status === ExecutionStatus.ERROR ? 'destructive' :
                'secondary'
              }
              className="mr-1"
            >
              {nodeState.status}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 text-xs">
          {/* Input Data */}
          {nodeState.inputs && Object.keys(nodeState.inputs).length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium mb-1">Inputs:</h4>
              <pre className="bg-gray-50 p-2 rounded border overflow-x-auto">
                {JSON.stringify(nodeState.inputs, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Output Data */}
          {nodeState.outputs && Object.keys(nodeState.outputs).length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium mb-1">Outputs:</h4>
              <pre className="bg-gray-50 p-2 rounded border overflow-x-auto">
                {JSON.stringify(nodeState.outputs, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Error Data */}
          {nodeState.error && (
            <div className="mb-3">
              <h4 className="font-medium mb-1">Error:</h4>
              <div className="bg-red-50 p-2 rounded border border-red-100 text-red-700">
                {nodeState.error}
              </div>
            </div>
          )}
          
          {/* Timing */}
          {nodeState.startTime && (
            <div className="flex items-center justify-between text-gray-500">
              <span>Started: {new Date(nodeState.startTime).toLocaleTimeString()}</span>
              {nodeState.endTime && (
                <span>
                  Duration: {
                    Math.round((new Date(nodeState.endTime).getTime() - new Date(nodeState.startTime).getTime()) / 1000)
                  }s
                </span>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 