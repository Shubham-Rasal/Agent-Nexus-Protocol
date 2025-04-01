'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PRESET_TOOLS } from '@/features/leadflow/tools/presets';
import { TOOL_CATEGORIES, Tool } from '@/features/leadflow/tools/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, Wrench, FileEdit, Trash2, Mail, FileSpreadsheet, Calendar, 
  BarChart2, X, CheckCircle, AlertCircle, ExternalLink, Code, Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatProviderName } from '@/components/WorkflowUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { executeTool } from '@/tools';
import { initiateGoogleAuth, isGoogleAuthenticated } from '@/services/googleAuth';
import GmailSendTool from '@/components/tools/GmailSendTool';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Map of category IDs to their icons
const CATEGORY_ICONS: Record<string, any> = {
  email: Mail,
  storage: Database,
  calendar: Calendar,
  analysis: BarChart2,
};

export default function ToolBuilderPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolConfig, setToolConfig] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check Google auth status when side panel opens for Gmail tool
  useEffect(() => {
    if (selectedTool?.id === 'gmail-send') {
      setIsAuthenticated(isGoogleAuthenticated());
    }
  }, [selectedTool]);

  const filteredTools = selectedCategory === 'all' 
    ? PRESET_TOOLS 
    : PRESET_TOOLS.filter(tool => tool.category === selectedCategory);

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setToolConfig({});
    setTestResult(null);
  };
  
  const closeSidebar = () => {
    setSelectedTool(null);
    setToolConfig({});
    setTestResult(null);
  };
  
  const handleConnect = () => {
    initiateGoogleAuth();
  };
  
  const handleTest = async () => {
    if (!selectedTool) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // For Gmail Send tool
      if (selectedTool.id === 'gmail-send') {
        const result = await executeTool('gmail-send', {
          to: toolConfig.to || '',
          subject: toolConfig.subject || 'Test Email from ANP Toolbox',
          body: toolConfig.body || 'This is a test email sent from the ANP toolbox.',
          cc: toolConfig.cc || '',
          bcc: toolConfig.bcc || ''
        });
        
        setTestResult(result);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: String(error)
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const updateConfig = (key: string, value: string) => {
    setToolConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`space-y-6 transition-all duration-300 ${selectedTool ? 'mr-[33.333%]' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tool Builder</h1>
          <p className="text-gray-500">Create and manage tools for your agents</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tool
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="min-w-20">All Tools</TabsTrigger>
          {TOOL_CATEGORIES.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="min-w-20">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map(tool => {
              const Icon = CATEGORY_ICONS[tool.category] || Wrench;
              
              return (
                <Card 
                  key={tool.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => handleToolClick(tool)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit functionality would go here
                          }}
                        >
                          <FileEdit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete functionality would go here
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Provider:</span>
                        <span className="font-medium">{formatProviderName(tool.provider)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Authentication:</span>
                        <Badge variant={tool.requiresAuth ? "warning" : "success"}>
                          {tool.requiresAuth ? 'Required' : 'Not Required'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Parameters:</span>
                        <span className="font-medium">{tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Tool Detail Sidebar */}
      {selectedTool && (
        <div className="w-1/3 border-l bg-white transition-all duration-300 transform h-screen fixed top-0 right-0 overflow-y-auto shadow-lg z-50">
          <ScrollArea className="h-screen">
            <div className="p-6">
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={closeSidebar}
              >
                <X className="h-6 w-6" />
              </button>

              <div className="pt-6">
                {/* Tool header with icon */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    test
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTool.name}</h2>
                    <Badge variant={selectedTool.requiresAuth ? "warning" : "success"} className="mt-1">
                      {selectedTool.requiresAuth ? 'Authentication Required' : 'No Authentication Required'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">{selectedTool.description}</p>
                
                {/* Tool details section */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <Badge variant="outline" className="px-3 py-1">
                        {TOOL_CATEGORIES.find(c => c.id === selectedTool.category)?.name || selectedTool.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <Badge variant="outline" className="px-3 py-1">
                        {formatProviderName(selectedTool.provider)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-sm">{new Date(selectedTool.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Parameters list */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Parameters</h3>
                    <div className="space-y-3">
                      {selectedTool.parameters.map(param => (
                        <div key={param.id} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="font-medium">{param.name}</span>
                            <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                              {param.required ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                          <div className="text-xs text-gray-500 mt-2">Type: {param.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Gmail Send specific UI */}
                  {selectedTool.id === 'gmail-send' && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Test Tool</h3>
                        
                        {!isAuthenticated ? (
                          <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm text-amber-800 mb-2">
                                    You need to connect your Gmail account to use this tool.
                                  </p>
                                  <Button onClick={handleConnect} size="sm">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Connect Gmail
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="to">To</Label>
                              <Input
                                id="to"
                                placeholder="recipient@example.com"
                                value={toolConfig.to || ''}
                                onChange={(e) => updateConfig('to', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="subject">Subject</Label>
                              <Input
                                id="subject"
                                placeholder="Email subject"
                                value={toolConfig.subject || ''}
                                onChange={(e) => updateConfig('subject', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="body">Body</Label>
                              <Textarea
                                id="body"
                                placeholder="Email body"
                                rows={4}
                                value={toolConfig.body || ''}
                                onChange={(e) => updateConfig('body', e.target.value)}
                                className="resize-y"
                              />
                            </div>
                            
                            <Button 
                              onClick={handleTest} 
                              disabled={isTesting || !toolConfig.to}
                              className="w-full"
                            >
                              {isTesting ? 'Sending Test Email...' : 'Send Test Email'}
                            </Button>
                            
                            {testResult && (
                              <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    {testResult.success ? (
                                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                                    )}
                                    <div>
                                      <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'}`}>
                                        {testResult.success 
                                          ? 'Test email sent successfully!' 
                                          : `Failed to send test email: ${testResult.error}`}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {/* Usage example */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Sample Usage</h3>
                    <div className="bg-gray-50 p-3 rounded-md font-mono text-xs overflow-x-auto">
                      <pre>
                        {`// Example usage in workflow
const result = await executeTool('${selectedTool.id}', {
${selectedTool.parameters.map(p => `  ${p.id}: ${p.type === 'string' ? `'example-${p.id}'` : p.type === 'number' ? '123' : p.type === 'boolean' ? 'true' : '[]'}`).join(',\n')}
});`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={closeSidebar}>
                      Close
                    </Button>
                    <Button className="flex-1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Use in Workflow
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 