"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivitySquare, AlignJustify, BarChart2, GitBranch, Wand2, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import TaskRouter from './TaskRouter';
import AgentStatus from './AgentStatus';

type SubTask = {
  id: string;
  description: string;
  agent?: any;
  status: 'pending' | 'in-progress' | 'completed';
  response?: string;
  thoughtProcess?: string;
};

type WorkflowPanelProps = {
  activeTasks?: SubTask[];
  tasks?: SubTask[];
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
};

export default function WorkflowPanel({ 
  activeTasks = [], 
  tasks = [], 
  open, 
  onOpenChange, 
  onClose 
}: WorkflowPanelProps) {
  const [activeTab, setActiveTab] = useState('workflow');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  
  // Use either tasks or activeTasks (for backward compatibility)
  const allTasks = tasks.length > 0 ? tasks : activeTasks;
  
  // Function to handle closing or changing open state
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (!newOpen && onClose) {
      onClose();
    }
  };
  
  // Toggle thought expansion
  const toggleThoughtExpansion = (taskId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  // Count tasks by status
  const taskCounts = {
    pending: allTasks.filter(t => t.status === 'pending').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length
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
            Agent Workflow
          </SheetTitle>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100">
            <TabsTrigger value="workflow" className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700">
              <GitBranch className="h-4 w-4" />
              <span>Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-1.5">
              <AlignJustify className="h-4 w-4" />
              <span>Agents</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflow" className="mt-4 space-y-5">
            {allTasks.length > 0 ? (
              <>
                <TaskRouter />
                
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Task Breakdown</h3>
                    
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
                    {allTasks.map((task) => (
                      <AgentStatus key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <ActivitySquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">No active workflow.</p>
                <p className="text-xs mt-1">Ask a question to start collaborating with agents.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="agents" className="mt-4">
            <div className="space-y-4">
              {allTasks.length > 0 ? (
                allTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 text-xs font-medium">
                        {task.agent?.name?.substring(0, 2) || 'NA'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{task.agent?.name || 'Unknown Agent'}</p>
                        <p className="text-xs text-gray-500">{task.agent?.description || 'No description available'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {task.agent?.knowledge_sources?.map((source: string, i: number) => (
                        <Badge key={i} variant="purple" className="text-xs">
                          {source.split(':')[0]}
                        </Badge>
                      )) || <Badge variant="secondary" className="text-xs">No knowledge sources</Badge>}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {task.agent?.tools?.map((tool: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      )) || <Badge variant="secondary" className="text-xs">No tools</Badge>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-sm">No agents currently active.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <div className="space-y-4">
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <h3 className="text-sm font-medium mb-3 text-gray-700">Task Execution</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Pending</span>
                      <span>{taskCounts.pending} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-400 h-2 rounded-full" 
                        style={{ width: `${allTasks.length ? (taskCounts.pending / allTasks.length) * 100 : 0}%` }}
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
                        style={{ width: `${allTasks.length ? (taskCounts.inProgress / allTasks.length) * 100 : 0}%` }}
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
                        style={{ width: `${allTasks.length ? (taskCounts.completed / allTasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {allTasks.length > 0 && (
                <>
                  <div className="bg-white rounded-md border border-gray-200 p-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-700">Agent Participation</h3>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {allTasks.map(task => (
                        <div key={task.id} className="rounded bg-gray-50 p-2 border border-gray-100">
                          <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs">
                            {task.agent?.name?.substring(0, 1) || 'NA'}
                          </div>
                          <p className="text-xs font-medium truncate">{task.agent?.name?.split(' ')[0] || 'Unknown Agent'}</p>
                          <Badge 
                            variant={
                              task.status === 'completed' ? 'success' : 
                              task.status === 'in-progress' ? 'info' : 'secondary'
                            }
                            className="mt-1 text-[10px] px-1.5 py-0"
                          >
                            {task.status === 'in-progress' ? 'Working' : task.status || 'No status'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Agent Thought Processes */}
                  <div className="bg-white rounded-md border border-gray-200 p-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                      <BrainCircuit className="h-4 w-4 mr-1.5 text-purple-600" />
                      Agent Thought Logs
                    </h3>
                    
                    <div className="space-y-3">
                      {allTasks.map(task => (
                        <div key={task.id} className="rounded border border-gray-200 overflow-hidden">
                          <div 
                            className="flex items-center justify-between bg-gray-50 p-2 cursor-pointer"
                            onClick={() => toggleThoughtExpansion(task.id)}
                          >
                            <div className="flex items-center">
                              <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs mr-2">
                                {task.agent?.name?.substring(0, 1) || 'NA'}
                              </div>
                              <span className="text-xs font-medium">{task.agent?.name?.split(' ')[0] || 'Unknown Agent'}</span>
                            </div>
                            {expandedThoughts[task.id] ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          
                          {expandedThoughts[task.id] && task.thoughtProcess && (
                            <div className="bg-white p-2 border-t border-gray-200">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                                {task.thoughtProcess}
                              </pre>
                            </div>
                          )}
                          
                          {expandedThoughts[task.id] && task.response && (
                            <div className="bg-white px-2 pb-2">
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-700 mb-1">Final Response:</p>
                                <p className="text-xs text-gray-600">{task.response || 'No response'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
} 