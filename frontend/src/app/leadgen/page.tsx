'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, UserCheck, Brain, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LeadGenPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample prompts to help users get started
  const samplePrompts = [
    "Find information about John Smith who works at Microsoft as a software engineer",
    "Analyze this lead: email: john.doe@example.com, LinkedIn: linkedin.com/in/johndoe",
    "Search for Sarah Williams who is a marketing director at Nike",
    "Collect details about Alex Johnson, CTO at TechCorp with GitHub profile github.com/alexj",
    "Find and qualify this lead: Jane Doe, Marketing Director at Acme Inc."
  ];

  const processInput = async () => {
    if (!input.trim()) {
      toast.error('Please enter a prompt', {
        description: 'You need to provide some text for the agent to process'
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setToolCalls([]);
    setDebugInfo(null);
    setError(null);

    try {
      // Call the API endpoint instead of the agent directly
      const response = await fetch('/api/agents/leadgen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process input');
      }

      setToolCalls(data.toolCalls || []);
      setResponse(data.response || 'No response received');
      
      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug);
        console.log('Debug info:', data.debug);
      }
      
      toast.success('Response generated', {
        description: 'The agent has processed your input'
      });
    } catch (error) {
      console.error('Error processing input:', error);
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error('Failed to process input', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const usePrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Lead Generation Agent</h1>
        <p className="text-gray-500">
          Test the lead generation agent with natural language queries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input section */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Agent Input
              </CardTitle>
              <CardDescription>
                Enter a prompt to search for lead information or qualify a lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="e.g., Find information about John Smith who works at Google..." 
                className="min-h-[150px] mb-4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={processInput}
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Process Input
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Agent Response
              </CardTitle>
              <CardDescription>
                The agent's response to your input
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-4" />
                  <p className="text-gray-500">Processing your input...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : response ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4 border whitespace-pre-wrap">
                    {response}
                  </div>
                  
                  {debugInfo && (
                    <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Debug Information:</p>
                      <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enter a prompt and click "Process Input" to see the response here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar section */}
        <div className="space-y-4">
          {/* Sample prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Prompts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {samplePrompts.map((prompt, index) => (
                  <div 
                    key={index}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => usePrompt(prompt)}
                  >
                    <p className="text-sm">{prompt}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tool calls display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tool Calls</CardTitle>
              <CardDescription className="text-xs">
                Tools used to generate the response
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {toolCalls.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y">
                    {toolCalls.map((call, index) => (
                      <div key={index} className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {call.tool}
                          </Badge>
                        </div>
                        
                        <div className="text-xs">
                          <p className="font-semibold mb-1">Input:</p>
                          <pre className="bg-gray-50 p-2 rounded text-[11px] overflow-x-auto">
                            {call.input}
                          </pre>
                        </div>
                        
                        <div className="text-xs">
                          <p className="font-semibold mb-1">Output:</p>
                          <pre className="bg-gray-50 p-2 rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {call.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-3 text-gray-500 text-center text-sm">
                  <p>No tool calls yet</p>
                  <p className="text-xs mt-1">Process a prompt to see tool usage</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agent Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Search className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Web Search</p>
                    <p className="text-xs text-gray-500">Search the web for lead information</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <UserCheck className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Lead Qualification</p>
                    <p className="text-xs text-gray-500">Evaluate if a lead is qualified based on contact info</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 