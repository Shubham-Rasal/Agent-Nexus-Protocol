'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PRESET_TOOLS } from '@/features/tools/presets';
import { TOOL_CATEGORIES, Tool } from '@/features/tools/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, Wrench, FileEdit, Trash2, Mail, FileSpreadsheet, Calendar, 
  BarChart2, X, CheckCircle, AlertCircle, ExternalLink, Code, Database, Loader2, FileText, FileIcon, FileDown, Video, LinkIcon, Clock, UserPlus, CalendarIcon, FileUp, FolderPlus, Upload, FileJson
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import GoogleCalendarTool from '@/components/tools/GoogleCalendarTool';
import AkaveStorageTool from '@/components/tools/AkaveStorageTool';
import CSVProcessorTool from '@/components/tools/CSVProcessorTool';

// Map of category IDs to their icons
const CATEGORY_ICONS: Record<string, any> = {
  email: Mail,
  storage: Database,
  calendar: Calendar,
  analysis: BarChart2,
  contact: UserPlus,
};

// Custom icons for specific tools
const TOOL_ICONS: Record<string, any> = {
  'google-calendar': CalendarIcon,
};

// Tool ID constants to avoid type errors
const TOOL_ID_GMAIL = 'gmail-send';
const TOOL_ID_AKAVE = 'akave-storage';
const TOOL_ID_CALENDAR = 'google-calendar';
const TOOL_ID_CSV = 'csv-processor';

export default function ToolBuilderPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolConfig, setToolConfig] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Check Google auth status when side panel opens for Gmail or Google Meet tools
  useEffect(() => {
    if (selectedTool?.id === 'gmail-send' || selectedTool?.id === 'google-calendar') {
      setIsAuthenticated(isGoogleAuthenticated());
    }
  }, [selectedTool?.id]);

  const filteredTools = selectedCategory === 'all' 
    ? [...PRESET_TOOLS]
    : [...PRESET_TOOLS].filter(tool => tool.category === selectedCategory);

  const handleToolClick = (tool: Tool) => {
    setToolConfig({});
    setSelectedTool(tool);
    setTestResult(null);
    setDownloadUrl(null);
  };
  
  const closeSidebar = () => {
    setSelectedTool(null);
    setToolConfig({});
    setTestResult(null);
    setDownloadUrl(null);
  };
  
  const handleConnect = () => {
    initiateGoogleAuth();
  };
  
  const handleTest = async () => {
    if (!selectedTool) return;
    
    setIsTesting(true);
    setTestResult(null);
    setDownloadUrl(null);
    
    try {
      // For Gmail Send tool
      if (selectedTool.id === TOOL_ID_GMAIL) {
        const result = await executeTool(TOOL_ID_GMAIL, {
          to: toolConfig.to || '',
          subject: toolConfig.subject || 'Test Email from ANP Toolbox',
          body: toolConfig.body || 'This is a test email sent from the ANP toolbox.',
          cc: toolConfig.cc || '',
          bcc: toolConfig.bcc || ''
        });
        
        setTestResult(result);
      }
      // For Akave Storage tool
      else if (selectedTool.id === TOOL_ID_AKAVE) {
        // For upload operations, check if we have file data
        if (toolConfig.operation === 'upload' && toolConfig.fileData) {
          const result = await executeTool(TOOL_ID_AKAVE, {
            bucketName: toolConfig.bucketName || '',
            operation: 'upload',
            fileName: toolConfig.fileName || '',
            fileData: toolConfig.fileData,
            fileType: toolConfig.fileType,
            createBucket: toolConfig.createBucket === 'true' || false
          });
          
          setTestResult(result);
        } else {
          const result = await executeTool(TOOL_ID_AKAVE, {
            bucketName: toolConfig.bucketName || '',
            operation: toolConfig.operation || 'list',
            fileName: toolConfig.fileName || undefined
          });
          
          setTestResult(result);
          
          // If it's a download operation and successful, set the download URL
          if (result.success && toolConfig.operation === 'download' && result.data?.downloadUrl) {
            setDownloadUrl(result.data.downloadUrl);
          }
        }
      }
      // For CSV Processor tool
      else if (selectedTool.id === TOOL_ID_CSV) {
        const result = await executeTool(TOOL_ID_CSV, {
          inputUrl: toolConfig.inputUrl || '',
          systemPrompt: toolConfig.systemPrompt || '',
          outputFormat: toolConfig.outputFormat || 'csv',
          maxRows: parseInt(toolConfig.maxRows || '1000'),
          model: toolConfig.model || 'llama3.1:8b'
        });
        
        setTestResult(result);
        
        // If successful and has outputUrl, set it for download
        if (result.success && result.outputUrl) {
          setDownloadUrl(result.outputUrl);
        }
      }
      // For Google Calendar tool
      else if (selectedTool.id === TOOL_ID_CALENDAR) {
        // Process attendees input to handle both comma and new line separations
        let attendees: string[] = [];
        if (toolConfig.attendees) {
          if (Array.isArray(toolConfig.attendees)) {
            attendees = toolConfig.attendees;
          } else {
            // Split by both commas and new lines, then clean up the results
            attendees = toolConfig.attendees
              .split(/,|\n/)
              .map((email: string) => email.trim())
              .filter((email: string) => email && email.includes('@')); // Basic validation for email format
          }
        }
        
        const result = await executeTool(TOOL_ID_CALENDAR, {
          title: toolConfig.title || 'Test Event',
          start: toolConfig.start || new Date().toISOString(),
          end: toolConfig.end || new Date(Date.now() + 3600000).toISOString(), // 1 hour later
          description: toolConfig.description || '',
          location: toolConfig.location || '',
          attendees: attendees,
          timezone: toolConfig.timezone || 'UTC',
          allDay: toolConfig.allDay || false,
          addMeet: toolConfig.addMeet !== false // Default to true
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
  
  // Handle file download for Akave Storage
  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = toolConfig.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }
  };
  
  const updateConfig = (key: string, value: string) => {
    setToolConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Check if we need to show a custom tool component or the default parameter form
  const renderToolTester = () => {
    if (selectedTool?.id === TOOL_ID_GMAIL) {
      return (
        <GmailSendTool 
          config={toolConfig} 
          onChange={setToolConfig} 
          onTest={setTestResult} 
        />
      );

    } else if (selectedTool?.id === TOOL_ID_AKAVE) {
      // Render Akave tool UI
      return (
        <AkaveStorageTool
          config={toolConfig}
          onChange={setToolConfig}
          onTest={setTestResult}
        />
      );
    } else if (selectedTool?.id === TOOL_ID_CSV) {
      // Render CSV tool UI
      return (
        <CSVProcessorTool
          config={toolConfig}
          onChange={setToolConfig}
          onTest={setTestResult}
        />
      );
    } else if (selectedTool?.id === TOOL_ID_CALENDAR) {
      // Render Calendar tool UI
      return (
        <GoogleCalendarTool 
          config={toolConfig} 
          onChange={setToolConfig} 
        />
      );
    } else {
      // Render default parameter form
      return (
        <div className="space-y-4">
          {selectedTool?.parameters && selectedTool.parameters.map(param => (
            <div key={param.id} className="space-y-2">
              <Label htmlFor={param.id}>{param.name}{param.required && ' *'}</Label>
              <Input
                id={param.id}
                placeholder={`Enter ${param.name.toLowerCase()}`}
                value={toolConfig[param.id] || ''}
                onChange={(e) => updateConfig(param.id, e.target.value)}
              />
              <p className="text-xs text-gray-500">{param.description}</p>
            </div>
          ))}
          
          {selectedTool?.parameters && selectedTool.parameters.length > 0 && (
            <Button 
              onClick={handleTest}
              disabled={isTesting}
              className="w-full mt-4"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>Test Tool</>
              )}
            </Button>
          )}
        </div>
      );
    }
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
              const Icon = TOOL_ICONS[tool.id] || CATEGORY_ICONS[tool.category] || Wrench;
              
              return (
                <Card 
                  key={tool.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${tool.name.includes('DEPRECATED') ? 'opacity-50' : ''}`} 
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
                    {selectedTool.name.includes('DEPRECATED') && (
                      <Badge variant="destructive" className="mt-1 ml-2">
                        Deprecated
                      </Badge>
                    )}
                  </div>
                </div>
                
                {selectedTool.name.includes('DEPRECATED') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                    <p className="text-amber-800">
                      This tool is deprecated and will be removed in a future update. 
                    </p>
                  </div>
                )}
                
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
                  
                  {/* Tool testing section */}
                                        <Separator />
                                        
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Test Tool</h3>
                    {renderToolTester()}
                    </div>
                  
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