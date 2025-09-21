"use client";
import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, Trash2, Play, Bot, Server, Check } from 'lucide-react';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import { MCPApiService } from '../../services/mcpApiService';
import { AgentEventDispatcher } from '@/services/agentEvents';

// Initialize AI providers
const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || 'your-api-key-here',
});

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

  // Convert MCP tool schema to Zod schema
  const convertMCPSchemaToZod = (schema: any): z.ZodType<any> => {
    if (!schema || !schema.properties) {
      return z.object({});
    }

    const zodObject: Record<string, z.ZodType<any>> = {};

    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      switch (prop.type) {
        case 'string':
          zodObject[key] = z.string().describe(prop.description || '');
          break;
        case 'number':
          zodObject[key] = z.number().describe(prop.description || '');
          break;
        case 'boolean':
          zodObject[key] = z.boolean().describe(prop.description || '');
          break;
        case 'array':
          zodObject[key] = z.array(z.any()).describe(prop.description || '');
          break;
        case 'object':
          zodObject[key] = z.object({}).describe(prop.description || '');
          break;
        default:
          zodObject[key] = z.any().describe(prop.description || '');
      }

      // Make optional if not in required array
      if (!schema.required?.includes(key)) {
        zodObject[key] = zodObject[key].optional();
      }
    });

    return z.object(zodObject);
  };

  // Create AI SDK tools from MCP servers with enhanced logging
  const createToolsFromMCPServers = (serverIds: string[]) => {
    const tools: Record<string, any> = {};
    let stepCounter = 0;

    serverIds.forEach(serverId => {
      const server = mcpServers.find(s => s.id === serverId);
      if (!server || server.status !== 'connected') {
        console.warn(`⚠️ Skipping unavailable server: ${serverId} (status: ${server?.status || 'not found'})`);
        return;
      }

      console.log(`🔌 Registering tools from server: ${server.name} (${serverId})`);

      server.tools.forEach(mcpTool => {
        const toolKey = `${server.name}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, '_');

        console.log(`📝 Registering tool: ${toolKey} -> ${server.name}.${mcpTool.name}`);

        tools[toolKey] = tool({
          description: mcpTool.description || `Tool from ${server.name}: ${mcpTool.name}`,
          inputSchema: mcpTool.inputSchema
            ? convertMCPSchemaToZod(mcpTool.inputSchema)
            : z.object({}),
          execute: async (args: any) => {
            stepCounter++;
            console.log(`🎬 Executing tool: ${toolKey} (Step #${stepCounter})`);
            console.log('📦 Raw execute args:', args);

            const { result, logEntry } = await handleMCPToolCall(serverId, mcpTool.name, args, stepCounter);

            // Store log entry in a way that can be accessed later
            if (!window.__currentToolCalls) {
              window.__currentToolCalls = [];
            }
            window.__currentToolCalls.push(logEntry);

            return result;
          }
        });
      });
    });

    console.log(`🎯 Total tools registered: ${Object.keys(tools).length}`);
    return tools;
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

      // Dispatch event to update mention system
      AgentEventDispatcher.dispatchAgentCreated(newAgent.id);

      setTimeout(() => setSaveStatus('idle'), 2000);
      closeModal();
    } catch (error) {
      console.error('Failed to save agent:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

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

      if (selectedAgent.llmProvider === 'google') {
        // Create tools from MCP servers
        const tools = createToolsFromMCPServers(selectedAgent.mcpServers);

        console.log('🛠️ Available tools:', Object.keys(tools));

        const result = await generateText({
          model: google("models/gemini-2.5-flash"),
          system: selectedAgent.systemPrompt,
          prompt: testQuery,
          tools: tools,
          // maxSteps: 10, // Limit tool execution steps
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'test-agent'
          }
        });

        // Enhanced response extraction
        if (result.text) {
          response = result.text;
        } else if (result.steps && result.steps.length > 0) {
          // If no final text, try to extract from steps
          const lastStep = result.steps[result.steps.length - 1];
          if (lastStep && 'text' in lastStep && lastStep.text) {
            response = lastStep.text;
          } else {
            // Fallback: create response from tool results
            const toolResults = window.__currentToolCalls || [];
            if (toolResults.length > 0) {
              const successfulResults = toolResults.filter(call => call.success);
              response = `Tool execution completed. ${successfulResults.length} successful tool calls out of ${toolResults.length} total calls.\n\n`;

              toolResults.forEach((call, index) => {
                response += `Step ${call.step}: ${call.toolName}\n`;
                if (call.success && call.result) {
                  // Try to extract meaningful content from result
                  if (typeof call.result === 'object' && call.result.content) {
                    response += `Result: ${call.result.content[0].text}\n\n`;
                  } else if (typeof call.result === 'string') {
                    response += `Result: ${call.result}\n\n`;
                  } else {
                    response += `Result: ${JSON.stringify(call.result, null, 2)}\n\n`;
                  }
                } else if (call.error) {
                  response += `Error: ${call.error}\n\n`;
                }
              });
            } else {
              response = "No response generated. This might indicate an issue with the AI model or tool execution.";
            }
          }
        } else {
          response = "No response generated from the AI model.";
        }

        console.log('📝 Generated Response:', response);
        console.log('📊 Result structure:', {
          hasText: !!result.text,
          textLength: result.text?.length || 0,
          stepsCount: result.steps?.length || 0,
          toolCallsCount: window.__currentToolCalls?.length || 0
        });

      } else {
        response = `Testing with ${selectedAgent.llmProvider} is not yet implemented. This is a mock response for agent "${selectedAgent.name}". Query: "${testQuery}"`;
        console.log('⚠️ Mock response generated for unsupported provider');
      }

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

      // Dispatch event to update mention system
      AgentEventDispatcher.dispatchAgentDeleted(agentId);
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

        // Dispatch event to update mention system
        AgentEventDispatcher.dispatchAllDataCleared();
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
        <div className="text-center mb-8 mt-12">

          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Agent
            </button>

            <button
              onClick={clearAllData}
              className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground py-3 px-4 rounded-lg font-medium hover:bg-destructive/90 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>

          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${saveStatus === 'saving' ? 'bg-accent text-accent-foreground' :
              saveStatus === 'saved' ? 'bg-accent text-accent-foreground' :
                'bg-destructive text-destructive-foreground'
              }`}>
              {saveStatus === 'saving' && '💾 Saving...'}
              {saveStatus === 'saved' && '✅ Saved'}
              {saveStatus === 'error' && '❌ Save failed'}
            </div>
          )}
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground mb-2">No agents created yet</h3>
            <p className="text-muted-foreground">Click "Create Agent" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <div key={agent.id} className="bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-card-foreground mb-2">{agent.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{agent.description}</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => openTestModal(agent)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Test agent"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">LLM Provider</span>
                    <p className="text-sm text-foreground mt-1">{agent.llmProvider}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uses</span>
                      <p className="text-sm text-foreground mt-1">{agent.usageCount}</p>
                    </div>
                    {agent.lastUsed && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Used</span>
                        <p className="text-sm text-foreground mt-1">
                          {new Date(agent.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {agent.tags.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.tags.map((tag, index) => (
                          <span
                            key={`${agent.id}-tag-${index}`}
                            className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.mcpServers.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MCP Servers</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.mcpServers.map((serverId, index) => {
                          const server = mcpServers.find(s => s.id === serverId);
                          return server ? (
                            <span
                              key={`${agent.id}-server-${index}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                            >
                              <Server className="h-3 w-3" />
                              {server.name} ({server.tools.length})
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {agent.tools.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Tools</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.tools.map((tool, index) => (
                          <span
                            key={`${agent.id}-tool-${index}`}
                            className="inline-block px-2 py-1 bg-accent text-accent-foreground rounded text-xs"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Prompt</span>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {agent.systemPrompt.length > 100
                        ? `${agent.systemPrompt.substring(0, 100)}...`
                        : agent.systemPrompt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Agent Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground">Create New Agent</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="e.g., Code Assistant, Content Writer, Data Analyst"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Brief description of what this agent does"
                  />
                </div>

                {/* System Prompt Field */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    System Prompt *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.systemPrompt}
                    onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                    className="w-full px-4 py-3 border border-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-vertical"
                    placeholder="Define the agent's behavior, personality, and capabilities..."
                  />
                </div>

                {/* LLM Provider Field */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    LLM Provider *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.llmProvider}
                      onChange={(e) => handleInputChange('llmProvider', e.target.value)}
                      className="w-full px-4 py-3 border border-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none bg-background"
                    >
                      <option value="">Select a provider...</option>
                      {llmProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* MCP Servers Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MCP Servers ({connectedMCPServers.length} available)
                  </label>
                  {connectedMCPServers.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Server className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No MCP servers connected</p>
                      <p className="text-xs text-gray-400 mt-1">Connect to MCP servers first to use them in agents</p>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {connectedMCPServers.map(server => (
                        <div
                          key={server.id}
                          className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                          onClick={() => toggleMCPServer(server.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{server.name}</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {server.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''} available
                              </p>
                              <div className="text-xs text-gray-400 mt-1">
                                Tools: {server.tools.map(t => t.name).join(', ')}
                              </div>
                            </div>
                            <div className="ml-3">
                              {formData.mcpServers.includes(server.id) ? (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.mcpServers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Selected servers:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.mcpServers.map((serverId, index) => {
                          const server = mcpServers.find(s => s.id === serverId);
                          return server ? (
                            <span
                              key={`selected-server-${index}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                            >
                              <Server className="h-3 w-3" />
                              {server.name} ({server.tools.length} tools)
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Field */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, addTag)}
                        className="flex-1 px-4 py-3 border border-input text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="e.g., coding, writing, analysis"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={`form-tag-${index}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${isFormValid
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 transform hover:scale-105'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                >
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Agent Modal */}
        {isTestModalOpen && selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground">Test Agent: {selectedAgent.name}</h2>
                <p className="text-muted-foreground mt-1">{selectedAgent.description}</p>
                {selectedAgent.mcpServers.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Connected MCP Servers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.mcpServers.map((serverId, index) => {
                        const server = mcpServers.find(s => s.id === serverId);
                        return server ? (
                          <span
                            key={`test-server-${index}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          >
                            <Server className="h-3 w-3" />
                            {server.name} ({server.tools.length} tools)
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Available Tools:</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedAgent.mcpServers.flatMap(serverId => {
                          const server = mcpServers.find(s => s.id === serverId);
                          return server ? server.tools.map(tool => `${server.name}.${tool.name}${tool.description ? ` - ${tool.description}` : ''}`) : [];
                        }).join(' • ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Query
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, testAgent)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter a query to test the agent..."
                      />
                      <button
                        onClick={testAgent}
                        disabled={!testQuery.trim() || isTestingAgent}
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${testQuery.trim() && !isTestingAgent
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <Play className="h-4 w-4" />
                        {isTestingAgent ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {testResults
                      .filter(result => result.agentId === selectedAgent.id)
                      .map((result, index) => (
                        <div key={`test-result-${selectedAgent.id}-${index}`} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <strong className="text-sm text-gray-700">Query:</strong>
                            <div className="text-right">
                              <span className="text-xs text-gray-500 block">
                                {new Date(result.timestamp).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {result.executionTime}ms
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 mb-3">{result.query}</p>

                          {/* Enhanced tool calls display */}
                          {result.toolCalls && result.toolCalls.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                              <strong className="text-sm text-blue-700 mb-2 block">
                                Tool Calls ({result.toolCalls.length}):
                              </strong>
                              {result.toolCalls.map((toolCall, toolIndex) => (
                                <div key={toolIndex} className="mt-2 p-3 bg-white rounded border-l-4 border-blue-300">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-blue-800">
                                      Step #{toolCall.step}: {toolCall.toolName}
                                      {toolCall.serverId && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          (Server: {toolCall.serverId})
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded ${toolCall.success
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                      }`}>
                                      {toolCall.success ? 'Success' : 'Failed'}
                                    </div>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <strong className="text-gray-700">Arguments:</strong>
                                      <pre className="mt-1 p-2 bg-gray-100 rounded text-gray-600 overflow-x-auto">
                                        {JSON.stringify(toolCall.args, null, 2)}
                                      </pre>
                                    </div>

                                    <div>
                                      <strong className="text-gray-700">Result:</strong>
                                      <pre className="mt-1 p-2 bg-gray-100 rounded text-gray-600 overflow-x-auto">
                                        {JSON.stringify(toolCall.result, null, 2)}
                                      </pre>
                                    </div>

                                    {toolCall.error && (
                                      <div>
                                        <strong className="text-red-700">Error:</strong>
                                        <p className="mt-1 p-2 bg-red-50 rounded text-red-600">
                                          {toolCall.error}
                                        </p>
                                      </div>
                                    )}

                                    <div className="text-gray-500">
                                      <strong>Timestamp:</strong> {new Date(toolCall.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <strong className="text-sm text-gray-700">Response:</strong>
                          <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{result.response}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeTestModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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