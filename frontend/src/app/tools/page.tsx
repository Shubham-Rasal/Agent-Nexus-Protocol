'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PRESET_TOOLS } from '@/features/leadflow/tools/presets';
import { TOOL_CATEGORIES, Tool } from '@/features/leadflow/tools/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, Wrench, FileEdit, Trash2, Mail, FileSpreadsheet, Calendar, 
  BarChart2, X, CheckCircle, AlertCircle, ExternalLink, Code, Database, Loader2, FileText, FileIcon, FileDown, Video, LinkIcon, Clock, UserPlus, CalendarIcon, FileUp, FolderPlus, Upload
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

// Map of category IDs to their icons
const CATEGORY_ICONS: Record<string, any> = {
  email: Mail,
  storage: Database,
  calendar: Calendar,
  analysis: BarChart2,
};

// Custom icons for specific tools
const TOOL_ICONS: Record<string, any> = {
  'google-calendar': CalendarIcon,
};

// Tool ID constants to avoid type errors
const TOOL_ID_GMAIL = 'gmail-send';
const TOOL_ID_AKAVE = 'akave-storage';
const TOOL_ID_CALENDAR = 'google-calendar';

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
    ? PRESET_TOOLS 
    : PRESET_TOOLS.filter(tool => tool.category === selectedCategory);

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
                  
                  {/* Tool testing section for Akave Storage */}
                  {selectedTool?.id === TOOL_ID_AKAVE && (
                    <div className="border rounded-md p-4 mt-6">
                      <h3 className="text-lg font-medium mb-4">Test Akave Storage</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bucketName">Bucket Name</Label>
                          <Input
                            id="bucketName"
                            placeholder="myBucket"
                            value={toolConfig.bucketName || ''}
                            onChange={(e) => updateConfig('bucketName', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="operation">Operation</Label>
                          <Select 
                            value={toolConfig.operation || 'list'} 
                            onValueChange={(value: string) => {
                              updateConfig('operation', value);
                              // Reset file data when changing operations
                              if (value !== 'upload') {
                                setToolConfig(prev => ({
                                  ...prev,
                                  fileData: undefined,
                                  fileType: undefined,
                                  createBucket: undefined
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select operation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="list">List Files</SelectItem>
                              <SelectItem value="info">File Info</SelectItem>
                              <SelectItem value="download">Download File</SelectItem>
                              <SelectItem value="upload">Upload File</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Upload specific UI */}
                        {toolConfig.operation === 'upload' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="fileName">File Name</Label>
                              <Input
                                id="fileName"
                                placeholder="myFile.txt"
                                value={toolConfig.fileName || ''}
                                onChange={(e) => updateConfig('fileName', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="fileUpload">Upload File</Label>
                              <div className="border rounded-md p-4 bg-gray-50">
                                <input
                                  type="file"
                                  id="fileUpload"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Update fileName if it's not already set
                                      if (!toolConfig.fileName) {
                                        updateConfig('fileName', file.name);
                                      }
                                      
                                      // Convert file to base64
                                      const reader = new FileReader();
                                      reader.readAsDataURL(file);
                                      reader.onload = () => {
                                        setToolConfig(prev => ({
                                          ...prev,
                                          fileData: reader.result as string,
                                          fileType: file.type
                                        }));
                                      };
                                    }
                                  }}
                                />
                                
                                {!toolConfig.fileData ? (
                                  <div className="text-center py-6">
                                    <FileUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <Button 
                                      variant="outline" 
                                      onClick={() => document.getElementById('fileUpload')?.click()}
                                      className="mb-2"
                                    >
                                      Select File
                                    </Button>
                                    <p className="text-xs text-gray-500">Supported file types: Any</p>
                                  </div>
                                ) : (
                                  <div className="bg-white p-3 rounded border">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <FileIcon className="h-5 w-5 text-blue-500" />
                                        <div>
                                          <p className="text-sm font-medium">{toolConfig.fileName}</p>
                                        </div>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setToolConfig(prev => ({
                                            ...prev,
                                            fileData: undefined,
                                            fileType: undefined
                                          }));
                                          // Reset the file input
                                          const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
                                          if (fileInput) fileInput.value = '';
                                        }}
                                      >
                                        Change
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2">
                              <input
                                type="checkbox"
                                id="createBucket"
                                checked={toolConfig.createBucket || false}
                                onChange={(e) => updateConfig('createBucket', e.target.checked.toString())}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor="createBucket" className="text-sm">
                                Create bucket if it doesn't exist
                              </Label>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              <FolderPlus className="h-3 w-3 inline-block mr-1" />
                              If checked, the system will create the bucket if it doesn't already exist
                            </p>
                          </>
                        )}
                        
                        {/* Info and Download specific UI (existing code) */}
                        {(toolConfig.operation === 'info' || toolConfig.operation === 'download') && (
                          <div className="space-y-2">
                            <Label htmlFor="fileName">File Name</Label>
                            <Input
                              id="fileName"
                              placeholder="myFile.txt"
                              value={toolConfig.fileName || ''}
                              onChange={(e) => updateConfig('fileName', e.target.value)}
                            />
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleTest} 
                          disabled={
                            isTesting || 
                            !toolConfig.bucketName || 
                            ((toolConfig.operation === 'info' || toolConfig.operation === 'download') && !toolConfig.fileName) ||
                            (toolConfig.operation === 'upload' && (!toolConfig.fileName || !toolConfig.fileData))
                          }
                          className="w-full"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {toolConfig.operation === 'upload' ? 'Uploading...' : 'Testing...'}
                            </>
                          ) : (
                            <>
                              {toolConfig.operation === 'list' && <FileText className="mr-2 h-4 w-4" />}
                              {toolConfig.operation === 'info' && <FileIcon className="mr-2 h-4 w-4" />}
                              {toolConfig.operation === 'download' && <FileDown className="mr-2 h-4 w-4" />}
                              {toolConfig.operation === 'upload' && <Upload className="mr-2 h-4 w-4" />}
                              {toolConfig.operation === 'upload' ? 'Upload File' : 
                                toolConfig.operation === 'list' ? 'List Files' : 
                                toolConfig.operation === 'info' ? 'Get File Info' : 'Download File'}
                            </>
                          )}
                        </Button>
                        
                        {testResult && (
                          <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'} mt-4`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {testResult.success ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'} mb-2`}>
                                    {testResult.success 
                                      ? `${toolConfig.operation === 'upload' ? 'File uploaded successfully!' : 'Operation completed successfully.'}`
                                      : `Operation failed: ${testResult.error}`}
                                  </p>
                                  
                                  {testResult.success && testResult.data && (
                                    <div>
                                      {toolConfig.operation === 'list' && (
                                        <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                                          <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                                        </div>
                                      )}
                                      
                                      {toolConfig.operation === 'info' && (
                                        <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                                          <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                                        </div>
                                      )}
                                      
                                      {toolConfig.operation === 'upload' && (
                                        <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                                          <div className="flex items-center gap-2 mb-2">
                                            <FileIcon className="h-4 w-4 text-green-600" />
                                            <span className="font-medium">{testResult.data.fileName}</span>
                                          </div>
                                          <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                                        </div>
                                      )}
                                      
                                      {toolConfig.operation === 'download' && downloadUrl && (
                                        <Button size="sm" onClick={handleDownload} variant="outline" className="mt-2">
                                          <FileDown className="mr-2 h-4 w-4" />
                                          Download {toolConfig.fileName}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tool testing section for Google Calendar */}
                  {selectedTool?.id === TOOL_ID_CALENDAR && (
                    <div className="border rounded-md p-4 mt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-medium">Google Calendar & Meet</h3>
                      </div>
                      
                      {!isAuthenticated ? (
                        <div className="text-center py-6">
                          <div className="flex justify-center space-x-2 mb-4">
                            <CalendarIcon className="h-12 w-12 text-blue-400" />
                            <Video className="h-12 w-12 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            You need to connect your Google account to create calendar events and meetings.
                          </p>
                          <Button onClick={handleConnect} variant="default">
                            Connect Google Account
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                              id="title"
                              placeholder="Team Meeting"
                              value={toolConfig.title || ''}
                              onChange={(e) => updateConfig('title', e.target.value)}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 my-4 border p-3 rounded-md bg-blue-50">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Video className="h-4 w-4 text-blue-600" />
                                <Label htmlFor="addMeet" className="font-medium text-blue-800">Google Meet Videoconference</Label>
                              </div>
                              <p className="text-xs text-gray-600 ml-6 mt-1">Add a Google Meet link to this calendar event</p>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="addMeet"
                                type="checkbox"
                                className="mr-2 h-4 w-4"
                                checked={toolConfig.addMeet !== false} // Default to true
                                onChange={(e) => updateConfig('addMeet', e.target.checked.toString())}
                              />
                              <Label htmlFor="addMeet">Enabled</Label>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start">Start Time</Label>
                              <Input
                                id="start"
                                type="datetime-local"
                                value={toolConfig.start || ''}
                                onChange={(e) => updateConfig('start', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="end">End Time</Label>
                              <Input
                                id="end"
                                type="datetime-local"
                                value={toolConfig.end || ''}
                                onChange={(e) => updateConfig('end', e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              placeholder="Office Room 101"
                              value={toolConfig.location || ''}
                              onChange={(e) => updateConfig('location', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Event details and agenda..."
                              value={toolConfig.description || ''}
                              onChange={(e) => updateConfig('description', e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          {/* Attendees section with improved UI */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="attendees" className="font-medium">Attendees</Label>
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            </div>
                            
                            <div className="rounded-md border p-3 bg-gray-50">
                              <div className="flex items-center mb-2 text-sm">
                                <UserPlus className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Add people to invite to this event</span>
                              </div>
                              
                              <Textarea
                                id="attendees"
                                placeholder="Enter email addresses separated by commas or new lines:
example@gmail.com
*optional@gmail.com (add * for optional attendees)
another@company.com"
                                value={Array.isArray(toolConfig.attendees) ? toolConfig.attendees.join(', ') : toolConfig.attendees || ''}
                                onChange={(e) => {
                                  // Process the input to handle both comma-separated and line-break separated emails
                                  const inputValue = e.target.value;
                                  updateConfig('attendees', inputValue);
                                }}
                                rows={3}
                                className="mt-1"
                              />
                              
                              <p className="text-xs text-gray-500 mt-2">
                                Attendees will receive an email invitation and can RSVP to your event. 
                                Add an asterisk (*) before an email to mark that person as an optional attendee.
                                Example: *optional@gmail.com
                              </p>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleTest}
                            disabled={isTesting || !toolConfig.title || !toolConfig.start || !toolConfig.end}
                            className="w-full"
                          >
                            {isTesting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Event...
                              </>
                            ) : (
                              <>
                                {toolConfig.addMeet !== false ? (
                                  <>
                                    <Video className="mr-2 h-4 w-4" />
                                    Create Event with Meet
                                  </>
                                ) : (
                                  <>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    Create Calendar Event
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                          
                          {testResult && (
                            <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'} mt-4`}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {testResult.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'} mb-2`}>
                                      {testResult.success 
                                        ? 'Event created successfully!' 
                                        : `Failed to create event: ${testResult.error}`}
                                    </p>
                                    
                                    {testResult.success && testResult.data && (
                                      <div className="space-y-3 mt-3">
                                        <div>
                                          <h4 className="text-sm font-medium flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Event Details
                                          </h4>
                                          <p className="text-sm mt-1">{testResult.data.summary}</p>
                                          
                                          <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                              {new Date(testResult.data.start.dateTime).toLocaleString()} - {new Date(testResult.data.end.dateTime).toLocaleString()}
                                            </span>
                                          </div>
                                          
                                          {testResult.data.attendees && testResult.data.attendees.length > 0 && (
                                            <div className="mt-3">
                                              <h4 className="text-sm font-medium flex items-center">
                                                <UserPlus className="h-4 w-4 mr-2 text-blue-500" />
                                                Attendees ({testResult.data.attendees.length})
                                              </h4>
                                              <div className="mt-2 space-y-1">
                                                {testResult.data.attendees.map((attendee: any, index: number) => (
                                                  <div key={index} className="flex items-center text-xs bg-blue-50 rounded-full py-1 px-3 w-fit">
                                                    <span>{attendee.email}</span>
                                                    {attendee.optional && (
                                                      <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Optional</Badge>
                                                    )}
                                                    {!attendee.optional && (
                                                      <Badge variant="default" className="ml-1 text-[10px] py-0 h-4 bg-blue-500">Required</Badge>
                                                    )}
                                                    {attendee.responseStatus === 'accepted' && <CheckCircle className="h-3 w-3 ml-2 text-green-500" />}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div>
                                          <h4 className="text-sm font-medium flex items-center">
                                            <Video className="h-4 w-4 mr-2" />
                                            Google Calendar Link
                                          </h4>
                                          
                                          <div className="bg-white p-2 rounded border border-green-200 mt-2 flex items-center justify-between">
                                            <code className="text-xs text-blue-600 overflow-auto max-w-[250px]">{testResult.data.hangoutLink}</code>
                                            <Button 
                                              size="sm" 
                                              variant="ghost"
                                              className="h-6 w-6 p-0 flex-shrink-0"
                                              onClick={() => {
                                                navigator.clipboard.writeText(testResult.data.hangoutLink);
                                              }}
                                            >
                                              <LinkIcon className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tool testing section for Gmail Send */}
                  {selectedTool?.id === TOOL_ID_GMAIL && (
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
                              {isTesting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending Test Email...
                                </>
                              ) : (
                                <>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Test Email
                                </>
                              )}
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