'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Loader2, Globe, CircleDot, BookOpen, BrainCircuit, Wrench, Zap, Brain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResearchAgentOutput } from '@/components/ResearchAgentOutput';

export function ResearchAssistantAgentCard() {
  // State for research
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState<number>(3);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    summary?: string;
  } | null>(null);

  // State for testing
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<number>(3);
  const [isTesting, setIsTesting] = useState(false);
  const [toolResult, setToolResult] = useState<any>(null);
  const [agentResult, setAgentResult] = useState<any>(null);

  // State for agent output
  const [agentQuery, setAgentQuery] = useState('');
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [agentResponse, setAgentResponse] = useState<{
    success: boolean;
    response?: string;
    error?: string;
  } | null>(null);

  // Sample research topics
  const sampleTopics = [
    {
      label: 'Latest AI Developments',
      query: 'What are the latest developments in artificial intelligence in 2024?',
    },
    {
      label: 'Climate Change Research',
      query: 'Recent scientific findings on climate change mitigation strategies',
    },
    {
      label: 'Nutrition Science',
      query: 'Current research on plant-based diets and health outcomes',
    },
  ];

  // Research templates
  const researchTemplates = [
    {
      id: 'specific',
      label: 'Specific Question',
      template: 'What is [topic] and how does it work?',
    },
    {
      id: 'comparison',
      label: 'Comparison Research',
      template: 'Compare and contrast [topic A] vs [topic B]',
    },
    {
      id: 'timeline',
      label: 'Historical Timeline',
      template: 'What is the historical development of [topic] from [year] to present?',
    },
  ];

  // Handle selecting a sample topic
  const selectSampleTopic = (query: string) => {
    setSearchQuery(query);
  };

  // Handle selecting a template
  const selectTemplate = (templateId: string) => {
    const selectedTemplate = researchTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setSearchQuery(selectedTemplate.template);
    }
  };

  // Select a query for the agent
  const selectAgentQuery = (query: string) => {
    setAgentQuery(query);
  };

  // Run the research agent
  const runAgent = async () => {
    if (!agentQuery) {
      toast.error('Missing Query', { description: 'Please enter a research question.' });
      return;
    }

    setIsAgentProcessing(true);
    setAgentResponse(null);

    try {
      toast.info('Agent Processing', { description: 'The research agent is processing your query. This may take a moment...' });
      
      // Call the API endpoint instead of directly using the function
      const response = await fetch("/api/agents/research-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: agentQuery }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from research agent");
      }

      const result = {
        success: data.success,
        response: data.data?.response,
        error: data.error
      };
      
      setAgentResponse(result);
      
      if (result.success) {
        toast.success('Research Complete', { description: 'The agent has completed your research request.' });
      } else {
        toast.error('Research Failed', { description: result.error || 'Failed to complete research' });
      }
    } catch (error) {
      console.error('Agent error:', error);
      setAgentResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast.error('Agent Error', { description: error instanceof Error ? error.message : 'Failed to run research agent' });
    } finally {
      setIsAgentProcessing(false);
    }
  };

  // Conduct research
  const conductResearch = async () => {
    if (!searchQuery) {
      toast.error('Missing Search Query', { description: 'Please enter a research topic or question.' });
      return;
    }

    setIsSearching(true);
    setResult(null);

    try {
      const response = await fetch("/api/agents/research-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchQuery,
          numberOfResults 
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search the web');
      }

      setResult({
        success: true,
        data: data.data.response,
        summary: data.data.response
      });

      toast.success('Research Complete', { description: 'Web search completed successfully' });
    } catch (error) {
      console.error('Error conducting research:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast.error('Research Failed', { description: error instanceof Error ? error.message : 'Failed to conduct research' });
    } finally {
      setIsSearching(false);
    }
  };

  // Run direct tool test
  const testDirectTool = async () => {
    if (!testQuery) {
      toast.error('Missing Query', { description: 'Please enter a test query.' });
      return;
    }

    setIsTesting(true);
    setToolResult(null);

    try {
      const response = await fetch("/api/agents/research-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: testQuery,
          numberOfResults: testResults 
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setToolResult({
        success: data.success,
        data: data.data,
        error: data.error
      });
    } catch (error) {
      console.error('Tool test error:', error);
      setToolResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Test agent with the same query
  const testAgent = async () => {
    if (!testQuery) {
      toast.error('Missing Query', { description: 'Please enter a test query.' });
      return;
    }

    setIsTesting(true);
    setAgentResult(null);

    try {
      // Use the API endpoint instead of direct function call
      const response = await fetch("/api/agents/research-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: testQuery }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get agent response');
      }

      // Format the agent response
      const formattedResponse = {
        success: true,
        processedBy: 'Research Assistant Agent (gpt-4o-mini)',
        response: data.data.response,
        analysisComplete: true,
        timestamp: new Date().toISOString()
      };

      setAgentResult(formattedResponse);
    } catch (error) {
      console.error('Agent test error:', error);
      setAgentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Format JSON for display
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  // Select a test query from sample topics
  const selectTestQuery = (query: string) => {
    setTestQuery(query);
  };

  // Run both tests together
  const runBothTests = async () => {
    await testDirectTool();
    await testAgent();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base">Research Assistant</CardTitle>
        </div>
        <CardDescription>
          Search the web for information on any topic
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="query">
          <TabsList className="grid grid-cols-4 w-full rounded-none">
            <TabsTrigger value="query">Research Query</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="query" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="search-query" className="text-xs">Research Topic/Question</Label>
                  <Select onValueChange={selectTemplate}>
                    <SelectTrigger className="w-[130px] h-7 text-xs">
                      <SelectValue placeholder="Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      {researchTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} className="text-xs">
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea 
                  id="search-query"
                  placeholder="Enter your research question or topic here..." 
                  className="min-h-[80px] text-xs mt-1" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs">Example Topics</Label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {sampleTopics.map((topic, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => selectSampleTopic(topic.query)}
                    >
                      <div className="font-medium">{topic.label}</div>
                      <div className="text-gray-500 text-[10px] mt-1 truncate">{topic.query}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="num-results" className="text-xs">Number of Search Results</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="num-results"
                    type="number"
                    min={1}
                    max={10}
                    value={numberOfResults}
                    onChange={(e) => setNumberOfResults(Number(e.target.value))}
                    className="h-8 text-xs w-20"
                  />
                  <span className="text-xs text-gray-500">results</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-2"
                size="sm"
                onClick={conductResearch}
                disabled={isSearching || !searchQuery}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-3 w-3" />
                    Research Topic
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="px-4 py-3 space-y-4">
            {result ? (
              result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <CircleDot className="h-3 w-3 text-green-500" />
                      Research Complete
                    </div>
                  </div>
                  
                  {result.summary && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-purple-500" />
                        <Label className="text-xs font-medium">Summary</Label>
                      </div>
                      <div className="bg-purple-50 p-3 rounded text-xs">
                        {result.summary}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Detailed Results</Label>
                    <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[300px]">
                      <pre className="whitespace-pre-wrap">{result.data}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-xs text-red-800 font-medium">Research Failed</p>
                  <p className="text-xs text-red-700 mt-1">{result.error}</p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <Globe className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No results yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the Research Query tab to search for information</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agent" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="agent-query" className="text-xs">Ask the Research Agent</Label>
                <Textarea 
                  id="agent-query"
                  placeholder="Ask the research agent any question..." 
                  className="min-h-[80px] text-xs mt-1" 
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs">Example Questions</Label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {sampleTopics.map((topic, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => selectAgentQuery(topic.query)}
                    >
                      <div className="font-medium">{topic.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full mt-2"
                size="sm"
                onClick={runAgent}
                disabled={isAgentProcessing || !agentQuery}
              >
                {isAgentProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-3 w-3" />
                    Ask Agent
                  </>
                )}
              </Button>

              <Separator className="my-3" />

              {isAgentProcessing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Processing your research query...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take a moment as the agent gathers information</p>
                </div>
              ) : agentResponse ? (
                agentResponse.success ? (
                  <ResearchAgentOutput response={agentResponse.response || 'No response received'} />
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <h3 className="text-sm text-red-800 font-medium mb-1">Research Failed</h3>
                    <p className="text-xs text-red-700">{agentResponse.error}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Enter a research question above</p>
                  <p className="text-xs text-gray-400 mt-1">The AI agent will analyze your question, search for information, and provide a comprehensive answer</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="test-query" className="text-xs">Test Query</Label>
                <Textarea 
                  id="test-query"
                  placeholder="Enter a query to test both the tool and agent..." 
                  className="min-h-[60px] text-xs mt-1" 
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Sample Test Queries</Label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {sampleTopics.map((topic, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => selectTestQuery(topic.query)}
                    >
                      <div className="font-medium">{topic.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="test-results" className="text-xs">Number of Results</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="test-results"
                    type="number"
                    min={1}
                    max={10}
                    value={testResults}
                    onChange={(e) => setTestResults(Number(e.target.value))}
                    className="h-8 text-xs w-20"
                  />
                  <span className="text-xs text-gray-500">results</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button 
                  className="col-span-1"
                  size="sm"
                  variant="outline"
                  onClick={testDirectTool}
                  disabled={isTesting || !testQuery}
                >
                  <Wrench className="mr-1 h-3 w-3" />
                  Test Tool
                </Button>

                <Button 
                  className="col-span-1"
                  size="sm"
                  variant="outline"
                  onClick={testAgent}
                  disabled={isTesting || !testQuery}
                >
                  <BrainCircuit className="mr-1 h-3 w-3" />
                  Test Agent
                </Button>

                <Button 
                  className="col-span-1"
                  size="sm"
                  onClick={runBothTests}
                  disabled={isTesting || !testQuery}
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Test Both
                </Button>
              </div>

              {isTesting && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                  <span className="ml-2 text-xs">Running tests...</span>
                </div>
              )}

              {(toolResult || agentResult) && (
                <div className="space-y-4 mt-2">
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Wrench className="h-3 w-3 text-blue-500" />
                        <Label className="text-xs font-medium">Direct Tool Result</Label>
                      </div>
                      <Badge variant={toolResult?.success ? "default" : "destructive"} className="text-[10px]">
                        {toolResult?.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-[150px] bg-slate-50 rounded p-2">
                      <pre className="text-xs whitespace-pre-wrap">
                        {toolResult ? formatJson(toolResult) : "No results yet"}
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <BrainCircuit className="h-3 w-3 text-purple-500" />
                        <Label className="text-xs font-medium">Agent Result</Label>
                      </div>
                      <Badge variant={agentResult?.success ? "default" : "destructive"} className="text-[10px]">
                        {agentResult?.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    
                    {agentResult?.success ? (
                      <ResearchAgentOutput 
                        response={agentResult.response} 
                        maxHeight="200px"
                        className="border-0 shadow-none p-0"
                      />
                    ) : (
                      <ScrollArea className="h-[150px] bg-slate-50 rounded p-2">
                        <pre className="text-xs whitespace-pre-wrap">
                          {agentResult ? formatJson(agentResult) : "No results yet"}
                        </pre>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 