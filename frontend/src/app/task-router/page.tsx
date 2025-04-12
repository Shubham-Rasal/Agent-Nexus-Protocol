'use client';

import { useState } from 'react';
import { TaskRoutingInput } from '@/components/TaskRoutingInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TaskRouterPage() {
  const [completedTaskResult, setCompletedTaskResult] = useState<string | null>(null);
  
  const handleTaskComplete = (result: string) => {
    setCompletedTaskResult(result);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Task Router</h1>
          <p className="text-gray-500">
            Enter complex tasks for agents to solve together
          </p>
        </div>
        
        <Tabs defaultValue="task" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task">Task Router</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="task" className="space-y-4">
            <TaskRoutingInput onTaskComplete={handleTaskComplete} />
            
            {completedTaskResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Completed Task Result</CardTitle>
                  <CardDescription>
                    This is the final result after all subtasks have been processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {completedTaskResult}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Task Routing</CardTitle>
                <CardDescription>
                  How task routing works in the Agent Nexus Protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Task routing is a powerful feature that enables the Agent Nexus Protocol to break down complex tasks 
                  into subtasks and assign them to specialized agents. This allows the system to tackle problems that 
                  would be challenging for a single agent.
                </p>
                
                <h3 className="text-lg font-medium mt-4">How It Works</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>You submit a complex task or query</li>
                  <li>The task router analyzes the query and breaks it down into subtasks</li>
                  <li>Each subtask is assigned to the most appropriate specialized agent</li>
                  <li>Agents work on their assigned subtasks, potentially collaborating with each other</li>
                  <li>Results from all subtasks are compiled into a comprehensive final answer</li>
                </ol>
                
                <h3 className="text-lg font-medium mt-4">Available Agents</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Research Agent:</strong> Searches the web for information on any topic</li>
                  <li><strong>Email Outreach Agent:</strong> Drafts and sends personalized emails</li>
                  <li><strong>Meeting Scheduler:</strong> Schedules and coordinates meetings</li>
                  <li><strong>Data Analyzer:</strong> Analyzes structured data and extracts insights</li>
                  <li><strong>Lead Qualifier:</strong> Evaluates potential leads based on criteria</li>
                </ul>
                
                <h3 className="text-lg font-medium mt-4">Example Tasks</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>"Research company X and send an email to schedule a meeting"</li>
                  <li>"Find some info about Shubham Rasal's Github profile and send him a mail at bluequbits@gmail.com with relevant details and ask him when he would be free to book a call for an interview and book the call."</li>
                  <li>"Analyze recent market trends in AI and prepare a summary report"</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 