"use client";
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Plus, X, ChevronDown, Trash2, Play, Bot, Server, Check, ExternalLink, Star, Shield, Wrench, Calendar, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MCPApiService } from '../../services/mcpApiService';

// IndexedDB Service
class IndexedDBService {
  private dbName = 'AIAgentsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create agents store
        if (!db.objectStoreNames.contains('agents')) {
          const agentsStore = db.createObjectStore('agents', { keyPath: 'id' });
          agentsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create testResults store
        if (!db.objectStoreNames.contains('testResults')) {
          const resultsStore = db.createObjectStore('testResults', { keyPath: 'id' });
          resultsStore.createIndex('agentId', 'agentId', { unique: false });
          resultsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveAgent(agent: AgentData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents'], 'readwrite');
      const store = transaction.objectStore('agents');
      const request = store.put(agent);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllAgents(): Promise<AgentData[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents'], 'readonly');
      const store = transaction.objectStore('agents');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents'], 'readwrite');
      const store = transaction.objectStore('agents');
      const request = store.delete(agentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveTestResult(result: TestResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const resultWithId = {
      ...result,
      id: `${result.agentId}-${Date.now()}-${Math.random()}`
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['testResults'], 'readwrite');
      const store = transaction.objectStore('testResults');
      const request = store.put(resultWithId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllTestResults(): Promise<TestResult[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['testResults'], 'readonly');
      const store = transaction.objectStore('testResults');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getTestResultsByAgent(agentId: string): Promise<TestResult[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['testResults'], 'readonly');
      const store = transaction.objectStore('testResults');
      const index = store.index('agentId');
      const request = index.getAll(agentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteTestResultsByAgent(agentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.getTestResultsByAgent(agentId);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['testResults'], 'readwrite');
      const store = transaction.objectStore('testResults');
      
      let deletedCount = 0;
      const totalCount = results.length;
      
      if (totalCount === 0) {
        resolve();
        return;
      }
      
      results.forEach((result) => {
        const request = store.delete((result as any).id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          deletedCount++;
          if (deletedCount === totalCount) {
            resolve();
          }
        };
      });
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents', 'testResults'], 'readwrite');
      const agentsStore = transaction.objectStore('agents');
      const resultsStore = transaction.objectStore('testResults');
      
      let clearedStores = 0;
      
      const agentsRequest = agentsStore.clear();
      const resultsRequest = resultsStore.clear();
      
      agentsRequest.onerror = () => reject(agentsRequest.error);
      resultsRequest.onerror = () => reject(resultsRequest.error);
      
      agentsRequest.onsuccess = () => {
        clearedStores++;
        if (clearedStores === 2) resolve();
      };
      
      resultsRequest.onsuccess = () => {
        clearedStores++;
        if (clearedStores === 2) resolve();
      };
    });
  }

  async resetDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close the database if open
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      // Delete the database
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = async () => {
        // Reinitialize the database
        try {
          await this.init();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
    });
  }
}

// Import MCP types
interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPServer {
  id: string;
  name: string;
  type: 'http' | 'local';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
  status: 'connecting' | 'connected' | 'error' | 'disconnected';
  tools: MCPTool[];
  error?: string;
}

interface AgentData {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  llmProvider: string;
  tools: string[]; 
  mcpServers: string[]; 
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface ToolCallLog {
  step: number;
  toolName: string;
  serverId?: string;
  args: any;
  result: any;
  timestamp: string;
  success: boolean;
  error?: string;
}

interface TestResult {
  agentId: string;
  query: string;
  response: string;
  timestamp: string;
  toolCalls?: ToolCallLog[];
  executionTime: number;
}

const AIAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbService] = useState(() => new IndexedDBService());
  const [dbInitialized, setDbInitialized] = useState(false);
  
  const [formData, setFormData] = useState<Omit<AgentData, 'id' | 'createdAt' | 'usageCount'>>({
    name: '',
    description: '',
    systemPrompt: '',
    tags: [],
    llmProvider: '',
    tools: [],
    mcpServers: []
  });

  const [tagInput, setTagInput] = useState('');
  const [toolInput, setToolInput] = useState('');

  const [onChainAgents, setOnChainAgents] = useState<any[]>([]);
  const [onChainLoading, setOnChainLoading] = useState(true);
  const [selectedOnChainAgent, setSelectedOnChainAgent] = useState<any | null>(null);

  // Fetch agent card + reputation only when a specific agent is selected
  const { data: agentDetail, isLoading: agentDetailLoading } = useQuery({
    queryKey: ["agentDetail", selectedOnChainAgent?.agentId],
    queryFn: async () => {
      const uri = encodeURIComponent(selectedOnChainAgent?.agentURI ?? "");
      const res = await fetch(`/api/agents/${selectedOnChainAgent.agentId}?agentURI=${uri}`);
      if (!res.ok) throw new Error("Failed to fetch agent detail");
      return res.json();
    },
    enabled: !!selectedOnChainAgent,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => setOnChainAgents(data.agents ?? []))
      .catch(() => {})
      .finally(() => setOnChainLoading(false));
  }, []);

  const llmProviders = [
    { id: 'google', name: 'Google Gemini', model: 'models/gemini-2.5-flash' },
    { id: 'openai', name: 'OpenAI', model: 'gpt-3.5-turbo' },
    { id: 'anthropic', name: 'Anthropic Claude', model: 'claude-3-sonnet' },
    { id: 'cohere', name: 'Cohere', model: 'command' },
    { id: 'mistral', name: 'Mistral', model: 'mistral-7b' },
  ];

  // Initialize IndexedDB and load data
  useEffect(() => {
    const initializeDB = async () => {
      try {
        setSaveStatus('saving'); // Show loading state
        await dbService.init();
        setDbInitialized(true);
        
        // Load data after DB initialization
        const [loadedAgents, loadedResults] = await Promise.all([
          dbService.getAllAgents(),
          dbService.getAllTestResults()
        ]);
        
        setAgents(loadedAgents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setTestResults(loadedResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setSaveStatus('idle');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        setSaveStatus('error');
        
        // Try to reset and reinitialize the database
        console.log('Attempting to reset database...');
        try {
          await dbService.resetDatabase();
          setDbInitialized(true);
          setAgents([]);
          setTestResults([]);
          setSaveStatus('idle');
          console.log('Database reset successfully');
        } catch (resetError) {
          console.error('Failed to reset database:', resetError);
          // Database is completely unusable
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    };

    initializeDB();
    loadMCPServers();
  }, []);

  // Enhanced logging function
  const logToolCall = (step: number, toolName: string, args: any, result: any, success: boolean, error?: string, serverId?: string): ToolCallLog => {
    const logEntry: ToolCallLog = {
      step,
      toolName,
      serverId,
      args: args || {},
      result: result || null,
      timestamp: new Date().toISOString(),
      success,
      error
    };
    
    console.group(`🔧 Tool Call #${step}: ${toolName}`);
    console.log('📍 Server ID:', serverId || 'N/A');
    console.log('📥 Arguments:', JSON.stringify(args, null, 2));
    console.log('📤 Result:', JSON.stringify(result, null, 2));
    console.log('✅ Success:', success);
    if (error) console.log('❌ Error:', error);
    console.log('⏰ Timestamp:', logEntry.timestamp);
    console.groupEnd();
    
    return logEntry;
  };

  // Load MCP servers from API
  const loadMCPServers = async () => {
    try {
      const loadedServers = await MCPApiService.loadServers();
      setMcpServers(loadedServers);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    }
  };

  // Get connected MCP servers
  const connectedMCPServers = mcpServers.filter(server => server.status === 'connected');

  // Enhanced MCP Tool Call Handler with detailed logging
  const handleMCPToolCall = async (serverId: string, toolName: string, args: any, stepNumber: number): Promise<{
    result: any;
    logEntry: ToolCallLog;
  }> => {
    console.group(`🚀 Starting MCP Tool Call #${stepNumber}`);
    console.log('🎯 Target:', `${serverId}.${toolName}`);
    console.log('📋 Raw Arguments:', args);
    console.log('📋 Arguments Type:', typeof args);
    console.log('📋 Arguments Keys:', args ? Object.keys(args) : 'No args or undefined');

    try {
      // Find the server to ensure it's connected
      const server = mcpServers.find(s => s.id === serverId);
      if (!server) {
        const error = `Server ${serverId} not found`;
        const logEntry = logToolCall(stepNumber, toolName, args, null, false, error, serverId);
        console.groupEnd();
        return { result: { success: false, error }, logEntry };
      }

      if (server.status !== 'connected') {
        const error = `Server ${serverId} is not connected (status: ${server.status})`;
        const logEntry = logToolCall(stepNumber, toolName, args, null, false, error, serverId);
        console.groupEnd();
        return { result: { success: false, error }, logEntry };
      }

      // Check if the tool exists on the server
      const tool = server.tools.find(t => t.name === toolName);
      if (!tool) {
        const error = `Tool ${toolName} not found on server ${serverId}`;
        const logEntry = logToolCall(stepNumber, toolName, args, null, false, error, serverId);
        console.groupEnd();
        return { result: { success: false, error }, logEntry };
      }

      console.log('🔍 Tool Schema:', JSON.stringify(tool.inputSchema, null, 2));
      console.log('🔄 Calling MCP API...');

      // Ensure args is an object
      const processedArgs = args || {};
      console.log('🔧 Processed Arguments:', JSON.stringify(processedArgs, null, 2));

      // Call the MCP API service
      const result = await MCPApiService.callTool({
        serverId: serverId,
        toolName: toolName,
        arguments: processedArgs
      });

      console.log('📬 MCP API Response:', JSON.stringify(result, null, 2));

      if (result.result) {
        const logEntry = logToolCall(stepNumber, toolName, processedArgs, result.result, true, undefined, serverId);
        console.groupEnd();
        return { result: result.result, logEntry };
      } else {
        const error = result.error || 'Unknown error occurred';
        const errorResult = {
          success: false,
          error: error,
          toolName: toolName,
          serverId: serverId,
          args: processedArgs
        };
        const logEntry = logToolCall(stepNumber, toolName, processedArgs, errorResult, false, error, serverId);
        console.groupEnd();
        return { result: errorResult, logEntry };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
      console.error(`💥 Tool execution error:`, error);
      
      const errorResult = {
        success: false,
        error: errorMessage,
        toolName: toolName,
        serverId: serverId,
        args: args || {}
      };
      
      const logEntry = logToolCall(stepNumber, toolName, args, errorResult, false, errorMessage, serverId);
      console.groupEnd();
      return { result: errorResult, logEntry };
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      systemPrompt: '',
      tags: [],
      llmProvider: '',
      tools: [],
      mcpServers: []
    });
    setTagInput('');
    setToolInput('');
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openTestModal = (agent: AgentData) => {
    setSelectedAgent(agent);
    setTestQuery('');
    setIsTestModalOpen(true);
  };

  const closeTestModal = () => {
    setIsTestModalOpen(false);
    setSelectedAgent(null);
    setTestQuery('');
  };

  const handleInputChange = (field: keyof Omit<AgentData, 'id' | 'createdAt' | 'usageCount'>, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleMCPServer = (serverId: string) => {
    setFormData(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.includes(serverId)
        ? prev.mcpServers.filter(id => id !== serverId)
        : [...prev.mcpServers, serverId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.systemPrompt || !formData.llmProvider || !dbInitialized) {
      return;
    }

    setSaveStatus('saving');

    try {
      const newAgent: AgentData = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      await dbService.saveAgent(newAgent);
      setAgents(prev => [newAgent, ...prev]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      closeModal();
    } catch (error) {
      console.error('Failed to save agent:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Replace your testAgent function with this enhanced version
const testAgent = async () => {
  if (!selectedAgent || !testQuery.trim() || !dbInitialized) return;
  
  setIsTestingAgent(true);
  const startTime = Date.now();
  
  // Clear previous tool calls
  window.__currentToolCalls = [];
  
  console.group(`🤖 Testing Agent: ${selectedAgent.name}`);
  console.log('🎯 Query:', testQuery);
  console.log('🔧 System Prompt:', selectedAgent.systemPrompt);
  console.log('🔌 MCP Servers:', selectedAgent.mcpServers);
  
  try {
    let response = '';
    
    // Run test via server-side API to avoid bundling AI SDKs client-side
    const res = await fetch('/api/test-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: selectedAgent.systemPrompt,
        query: testQuery,
        llmProvider: selectedAgent.llmProvider,
        mcpServers: selectedAgent.mcpServers,
      }),
    });
    const data = await res.json();
    response = data.response || "No response generated";

    const executionTime = Date.now() - startTime;
    const toolCallLogs: ToolCallLog[] = window.__currentToolCalls || [];

    const testResult: TestResult = {
      agentId: selectedAgent.id,
      query: testQuery,
      response: response || "No response generated",
      timestamp: new Date().toISOString(),
      toolCalls: toolCallLogs.length > 0 ? toolCallLogs : undefined,
      executionTime
    };

    console.log('💾 Final Test Result:', testResult);
    console.groupEnd();

    // Save to IndexedDB
    await dbService.saveTestResult(testResult);
    setTestResults(prev => [testResult, ...prev]);
    
    // Update agent usage
    const updatedAgent = { 
      ...selectedAgent, 
      usageCount: selectedAgent.usageCount + 1, 
      lastUsed: new Date().toISOString() 
    };
    
    await dbService.saveAgent(updatedAgent);
    setAgents(prev => prev.map(agent => 
      agent.id === selectedAgent.id ? updatedAgent : agent
    ));
    
    setTestQuery('');
  } catch (error) {
    console.error('Error testing agent:', error);
    console.groupEnd();
    
    const executionTime = Date.now() - startTime;
    const toolCallLogs: ToolCallLog[] = window.__currentToolCalls || [];
    
    let errorMessage = `Error testing agent: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    // If we have tool call logs, include them in the error response
    if (toolCallLogs.length > 0) {
      errorMessage += `\n\nTool calls were executed before the error:`;
      toolCallLogs.forEach((call, index) => {
        errorMessage += `\n${index + 1}. ${call.toolName}: ${call.success ? 'Success' : 'Failed'}`;
        if (call.error) {
          errorMessage += ` (${call.error})`;
        }
      });
    }
    
    const errorResult: TestResult = {
      agentId: selectedAgent.id,
      query: testQuery,
      response: errorMessage,
      timestamp: new Date().toISOString(),
      toolCalls: toolCallLogs.length > 0 ? toolCallLogs : undefined,
      executionTime
    };
    
    // Save error result to IndexedDB
    try {
      await dbService.saveTestResult(errorResult);
      setTestResults(prev => [errorResult, ...prev]);
    } catch (saveError) {
      console.error('Failed to save error result:', saveError);
    }
  } finally {
    setIsTestingAgent(false);
    // Clean up
    window.__currentToolCalls = [];
  }
};
  // const testAgent = async () => {
  //   if (!selectedAgent || !testQuery.trim() || !dbInitialized) return;
    
  //   setIsTestingAgent(true);
  //   const startTime = Date.now();
    
  //   // Clear previous tool calls
  //   window.__currentToolCalls = [];
    
  //   console.group(`🤖 Testing Agent: ${selectedAgent.name}`);
  //   console.log('🎯 Query:', testQuery);
  //   console.log('🔧 System Prompt:', selectedAgent.systemPrompt);
  //   console.log('🔌 MCP Servers:', selectedAgent.mcpServers);
    
  //   try {
  //     let response = '';
      
  //     if (selectedAgent.llmProvider === 'google') {
  //       // Create tools from MCP servers
  //       const tools = createToolsFromMCPServers(selectedAgent.mcpServers);
        
  //       console.log('🛠️ Available tools:', Object.keys(tools));

  //       const result = await generateText({
  //         model: google("models/gemini-2.5-flash"),
  //         system: selectedAgent.systemPrompt,
  //         prompt: testQuery,
  //         tools: tools,
  //       });

  //       response = result.text;
  //       console.log('📝 Generated Response:', response);

  //       // Log the complete result structure for debugging
  //       console.group('🔍 Complete AI SDK Result Structure');
  //       console.log('Result object:', result);
  //       console.log('Result.steps:', result.steps);
  //       console.log('Tool calls from window:', window.__currentToolCalls);
  //       console.groupEnd();

  //     } else {
  //       response = `Testing with ${selectedAgent.llmProvider} is not yet implemented. This is a mock response for agent "${selectedAgent.name}". Query: "${testQuery}"`;
  //       console.log('⚠️ Mock response generated for unsupported provider');
  //     }

  //     const executionTime = Date.now() - startTime;
  //     const toolCallLogs: ToolCallLog[] = window.__currentToolCalls || [];

  //     const testResult: TestResult = {
  //       agentId: selectedAgent.id,
  //       query: testQuery,
  //       response,
  //       timestamp: new Date().toISOString(),
  //       toolCalls: toolCallLogs.length > 0 ? toolCallLogs : undefined,
  //       executionTime
  //     };

  //     console.log('💾 Final Test Result:', testResult);
  //     console.groupEnd();

  //     // Save to IndexedDB
  //     await dbService.saveTestResult(testResult);
  //     setTestResults(prev => [testResult, ...prev]);
      
  //     // Update agent usage
  //     const updatedAgent = { 
  //       ...selectedAgent, 
  //       usageCount: selectedAgent.usageCount + 1, 
  //       lastUsed: new Date().toISOString() 
  //     };
      
  //     await dbService.saveAgent(updatedAgent);
  //     setAgents(prev => prev.map(agent => 
  //       agent.id === selectedAgent.id ? updatedAgent : agent
  //     ));
      
  //     setTestQuery('');
  //   } catch (error) {
  //     console.error('Error testing agent:', error);
  //     console.groupEnd();
      
  //     const executionTime = Date.now() - startTime;
  //     const errorResult: TestResult = {
  //       agentId: selectedAgent.id,
  //       query: testQuery,
  //       response: `Error testing agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
  //       timestamp: new Date().toISOString(),
  //       executionTime
  //     };
      
  //     // Save error result to IndexedDB
  //     try {
  //       await dbService.saveTestResult(errorResult);
  //       setTestResults(prev => [errorResult, ...prev]);
  //     } catch (saveError) {
  //       console.error('Failed to save error result:', saveError);
  //     }
  //   } finally {
  //     setIsTestingAgent(false);
  //     // Clean up
  //     window.__currentToolCalls = [];
  //   }
  // };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!dbInitialized) return;

    try {
      await Promise.all([
        dbService.deleteAgent(agentId),
        dbService.deleteTestResultsByAgent(agentId)
      ]);
      
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      setTestResults(prev => prev.filter(result => result.agentId !== agentId));
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const clearAllData = async () => {
    if (!dbInitialized) return;
    
    if (confirm('Are you sure you want to clear all agents and test results? This cannot be undone.')) {
      try {
        await dbService.clearAllData();
        setAgents([]);
        setTestResults([]);
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  const isFormValid = formData.name && formData.description && formData.systemPrompt && formData.llmProvider;

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-12" />

       
        {/* MCP Servers Status */}
        {/* <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium text-card-foreground">Available MCP Servers</h2>
            <button
              onClick={loadMCPServers}
              className="ml-auto text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Refresh
            </button>
          </div>
          {connectedMCPServers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No MCP servers connected</p>
              <p className="text-xs text-muted-foreground mt-1">Go to MCP Servers to connect servers first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedMCPServers.map(server => (
                <div key={server.id} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-foreground">{server.name}</span>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {server.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {server.tools.map(t => t.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}

        {/* On-Chain Agents */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">On-Chain Agents</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              ERC-8004 · Filecoin Calibration
            </span>
          </div>

          {onChainLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card rounded-xl shadow p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : onChainAgents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No on-chain agents found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onChainAgents.map(agent => (
                <div key={agent.agentId} onClick={() => setSelectedOnChainAgent(agent)} className="bg-card rounded-xl shadow p-6 hover:shadow-md transition-shadow flex flex-col gap-3 cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="text-base font-semibold text-card-foreground truncate">{agent.name}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">#{agent.agentId}</span>
                  </div>

                  {agent.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{agent.reputationScore ?? 50} / 100</span>
                    </div>
                    <span className="font-mono truncate max-w-[120px]" title={agent.owner}>
                      {agent.owner ? `${agent.owner.slice(0,6)}…${agent.owner.slice(-4)}` : '—'}
                    </span>
                  </div>

                  {agent.tools?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.slice(0, 4).map((t: string) => (
                        <span key={t} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{t}</span>
                      ))}
                      {agent.tools.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{agent.tools.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
                    <span className="text-xs text-muted-foreground">
                      {agent.registeredAt ? new Date(agent.registeredAt).toLocaleDateString() : ''}
                    </span>
                    {agent.agentURI && (
                      <a
                        href={agent.agentURI.startsWith('ipfs://') ? `https://w3s.link/ipfs/${agent.agentURI.slice(7)}` : agent.agentURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Card <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Detail Sheet */}
        <Sheet open={!!selectedOnChainAgent} onOpenChange={(open) => { if (!open) setSelectedOnChainAgent(null); }}>
          <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto p-6">
            {selectedOnChainAgent && (() => {
              const detail = agentDetail ?? {};
              const agent = { ...selectedOnChainAgent, ...detail };
              return (
                <>
                  <SheetHeader className="mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <SheetTitle>{agent.name}</SheetTitle>
                        <SheetDescription>Agent #{agent.agentId}</SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="space-y-6">
                    {agentDetailLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading details…
                      </div>
                    )}

                    {/* Description */}
                    {agent.description && (
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    )}

                    {/* Reputation */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Reputation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${agent.reputationScore ?? 50}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{agent.reputationScore ?? 50}/100</span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</span>
                      </div>
                      <p className="text-sm font-mono break-all">{agent.owner}</p>
                    </div>

                    {/* Registered */}
                    {agent.registeredAt && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registered</span>
                        </div>
                        <p className="text-sm">{new Date(agent.registeredAt).toLocaleString()}</p>
                      </div>
                    )}

                    {/* Privacy & Trust */}
                    {agent.privacy_level && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Privacy Level</span>
                        </div>
                        <span className="text-sm capitalize">{agent.privacy_level}</span>
                      </div>
                    )}

                    {/* Tools */}
                    {agent.tools?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tools</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {agent.tools.map((t: string) => (
                            <span key={t} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Knowledge Sources */}
                    {agent.knowledge_sources?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Knowledge Sources</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {agent.knowledge_sources.map((k: string) => (
                            <span key={k} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* System Prompt */}
                    {agent.systemPrompt && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Prompt</span>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{agent.systemPrompt}</p>
                      </div>
                    )}

                    {/* Agent URI */}
                    {agent.agentURI && (
                      <div className="pt-2 border-t border-border">
                        <a
                          href={agent.agentURI.startsWith('ipfs://') ? `https://w3s.link/ipfs/${agent.agentURI.slice(7)}` : agent.agentURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          View Agent Card <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

      </div>
    </div>
  );
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    __currentToolCalls?: ToolCallLog[];
  }
}

export default AIAgentsPage;
