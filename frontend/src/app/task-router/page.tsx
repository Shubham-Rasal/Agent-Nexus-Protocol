'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
                  <div className="p-4 bg-gray-50 rounded-md prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {completedTaskResult}
                    </ReactMarkdown>
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
                  The Task Router implementation routes user queries to specialized agents based on intent recognition.
                  Currently, the router supports routing to the Gmail Assistant and Lead Qualifier agents.
                </p>
                
                <h3 className="text-lg font-medium mt-4">How It Works</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>You submit a query or task using the input form</li>
                  <li>The task router analyzes the query using the Lilypad Inference API to determine intent</li>
                  <li>Based on the detected intent, the query is routed to either the Gmail or Lead Qualifier agent</li>
                  <li>The appropriate agent processes the query and returns results</li>
                  <li>Results are displayed in the interface</li>
                </ol>
                
                <h3 className="text-lg font-medium mt-4">Available Agents</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Gmail Agent:</strong> Handles email-related tasks such as drafting, sending, or searching emails</li>
                  <li><strong>Lead Qualifier Agent:</strong> Evaluates potential leads based on criteria such as contact information (email, LinkedIn, GitHub)</li>
                  <li><strong>Research Agent:</strong> Searches the web for information on any topic</li>
                  <li><strong>Email Outreach Agent:</strong> Drafts and sends personalized emails</li>
                  <li><strong>Meeting Scheduler:</strong> Schedules and coordinates meetings</li>
                  <li><strong>Data Analyzer:</strong> Analyzes structured data and extracts insights</li>
                  <li><strong>Lead Generation Agent:</strong> Finds and gathers information about potential leads</li>
                </ul>
                
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 my-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Technical Implementation Note</h4>
                  <p className="text-xs text-amber-700">
                    The current implementation uses Lilypad Inference API to determine the intent of user queries and route them
                    to either the Gmail Assistant or Lead Qualifier agent. Additional agents can be added to the router in the future.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium mt-4">Example Tasks</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>"Send an email to john@example.com about our upcoming meeting"</li>
                  <li>"Qualify this lead: email: sarah@company.com, LinkedIn: linkedin.com/in/sarahjones"</li>
                  <li>"Find information about potential leads in the fintech industry and send them personalized introduction emails"</li>
                  <li>"Generate a list of marketing directors at Fortune 500 companies and draft follow-up emails to schedule demos"</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 