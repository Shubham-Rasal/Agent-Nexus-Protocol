"use client";
import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, Settings, Trash2, Play, Bot, Server, Check } from 'lucide-react';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool} from "ai";
import { z } from "zod";
import { MCPApiService } from '../../services/mcpApiService';

// Initialize AI providers
const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || 'your-api-key-here',
});

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
  tools: string[]; // Keep for backward compatibility
  mcpServers: string[]; // New field for MCP server IDs
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface TestResult {
  agentId: string;
  query: string;
  response: string;
  timestamp: string;
  toolCalls?: Array<{
    toolName: string;
    args: any;
    result: any;
  }>;
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
    { id: 'google', name: 'Google Gemini', model: 'models/gemini-1.5-flash' },
    { id: 'openai', name: 'OpenAI', model: 'gpt-3.5-turbo' },
    { id: 'anthropic', name: 'Anthropic Claude', model: 'claude-3-sonnet' },
    { id: 'cohere', name: 'Cohere', model: 'command' },
    { id: 'mistral', name: 'Mistral', model: 'mistral-7b' },
  ];

  // Load MCP servers on component mount
  useEffect(() => {
    loadMCPServers();
  }, []);

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

  // MCP Tool Call Handler
  const handleMCPToolCall = async (serverId: string, toolName: string, args: any): Promise<any> => {
    try {
      console.log(`Executing MCP tool: ${serverId}.${toolName}`, args);

      // Find the server to ensure it's connected
      const server = mcpServers.find(s => s.id === serverId);
      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      if (server.status !== 'connected') {
        throw new Error(`Server ${serverId} is not connected (status: ${server.status})`);
      }

      // Check if the tool exists on the server
      const tool = server.tools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found on server ${serverId}`);
      }

      // Call the MCP API service
      const result = await MCPApiService.callTool({
        serverId: serverId,
        toolName: toolName,
        arguments: args
      });

      if (result.result) {
        console.log(`MCP tool result:`, result.result);
        return result.result;
      } else {
        // Return error info instead of throwing, so the AI can handle it gracefully
        const error = result.error || 'Unknown error occurred';
        return {
          success: false,
          error: error,
          toolName: toolName,
          serverId: serverId,
          args: args
        };
      }

    } catch (error) {
      console.error(`Error executing MCP tool ${serverId}.${toolName}:`, error);

      // Return error info instead of throwing, so the AI can handle it gracefully
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        toolName: toolName,
        serverId: serverId,
        args: args
      };
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

  // Create AI SDK tools from MCP servers
  const createToolsFromMCPServers = (serverIds: string[]) => {
    const tools: Record<string, any> = {};

    serverIds.forEach(serverId => {
      const server = mcpServers.find(s => s.id === serverId);
      if (!server || server.status !== 'connected') return;

      server.tools.forEach(mcpTool => {
        const toolKey = `${server.name}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
        
        tools[toolKey] = tool({
          description: mcpTool.description || `Tool from ${server.name}`,
          parameters: mcpTool.inputSchema 
            ? convertMCPSchemaToZod(mcpTool.inputSchema)
            : z.object({}),
          execute: async (args) => {
            console.log(`Attempting to execute MCP tool: ${server.name}.${mcpTool.name}`, args);
            
            try {
              console.log(`Calling MCP tool: ${serverId} -> ${mcpTool.name}`);
              const result = await handleMCPToolCall(serverId, mcpTool.name, args);
              console.log(`MCP tool result:`, result);
              return result;
            } catch (error) {
              console.error(`Error executing MCP tool ${mcpTool.name}:`, error);
              return {
                success: false,
                error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                toolName: mcpTool.name,
                serverId: serverId,
                args: args
              };
            }
          }
        });
      });
    });

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

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.systemPrompt || !formData.llmProvider) {
      return;
    }

    const newAgent: AgentData = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setAgents(prev => [newAgent, ...prev]);
    closeModal();
  };

  const testAgent = async () => {
    if (!selectedAgent || !testQuery.trim()) return;
    
    setIsTestingAgent(true);
    const toolCalls: Array<{ toolName: string; args: any; result: any }> = [];
    
    try {
      let response = '';
      
      if (selectedAgent.llmProvider === 'google') {
        // Create tools from MCP servers
        const tools = createToolsFromMCPServers(selectedAgent.mcpServers);
        
        console.log('Available tools:', Object.keys(tools));
        console.log('System Prompt:', selectedAgent.systemPrompt);

        const result = await generateText({
          model: google("models/gemini-1.5-flash"),
          system: selectedAgent.systemPrompt,
          prompt: testQuery,
          tools: tools,
        });

        response = result.text;

        // Extract tool calls and results from steps
        if (result.steps) {
          result.steps.forEach((step: any) => {
            if (step.toolCalls && step.toolResults) {
              step.toolCalls.forEach((toolCall: any, index: number) => {
                const toolResult = step.toolResults[index];
                toolCalls.push({
                  toolName: toolCall.toolName,
                  args: toolCall.args,
                  result: toolResult?.result || toolResult
                });
              });
            }
          });
        }
      } else {
        response = `Testing with ${selectedAgent.llmProvider} is not yet implemented. This is a mock response for agent "${selectedAgent.name}". Query: "${testQuery}"`;
      }

      const testResult: TestResult = {
        agentId: selectedAgent.id,
        query: testQuery,
        response,
        timestamp: new Date().toISOString(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };

      setTestResults(prev => [testResult, ...prev]);
      
      // Update agent usage
      setAgents(prev => prev.map(agent => 
        agent.id === selectedAgent.id 
          ? { ...agent, usageCount: agent.usageCount + 1, lastUsed: new Date().toISOString() }
          : agent
      ));
      
      setTestQuery('');
    } catch (error) {
      console.error('Error testing agent:', error);
      const errorResult: TestResult = {
        agentId: selectedAgent.id,
        query: testQuery,
        response: `Error testing agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [errorResult, ...prev]);
    } finally {
      setIsTestingAgent(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const deleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
    setTestResults(prev => prev.filter(result => result.agentId !== agentId));
  };

  const isFormValid = formData.name && formData.description && formData.systemPrompt && formData.llmProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Agent Management System</h1>
          <p className="text-gray-600 mb-6">Create, test, and manage custom AI agents with MCP tool integration</p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create Agent
          </button>
        </div>

        {/* MCP Servers Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Available MCP Servers</h2>
            <button
              onClick={loadMCPServers}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          {connectedMCPServers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No MCP servers connected</p>
              <p className="text-xs text-gray-400 mt-1">Go to MCP Servers to connect servers first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedMCPServers.map(server => (
                <div key={server.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">{server.name}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {server.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    {server.tools.map(t => t.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">No agents created yet</h3>
            <p className="text-gray-400">Click "Create Agent" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <div key={agent.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{agent.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{agent.description}</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => openTestModal(agent)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Test agent"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">LLM Provider</span>
                    <p className="text-sm text-gray-800 mt-1">{agent.llmProvider}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uses</span>
                      <p className="text-sm text-gray-800 mt-1">{agent.usageCount}</p>
                    </div>
                    {agent.lastUsed && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Used</span>
                        <p className="text-sm text-gray-800 mt-1">
                          {new Date(agent.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {agent.tags.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.tags.map((tag, index) => (
                          <span
                            key={`${agent.id}-tag-${index}`}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.mcpServers.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">MCP Servers</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.mcpServers.map((serverId, index) => {
                          const server = mcpServers.find(s => s.id === serverId);
                          return server ? (
                            <span
                              key={`${agent.id}-server-${index}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
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
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom Tools</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.tools.map((tool, index) => (
                          <span
                            key={`${agent.id}-tool-${index}`}
                            className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">System Prompt</span>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                      {agent.systemPrompt.length > 100 
                        ? `${agent.systemPrompt.substring(0, 100)}...` 
                        : agent.systemPrompt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Create New Agent</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Code Assistant, Content Writer, Data Analyst"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Brief description of what this agent does"
                  />
                </div>

                {/* System Prompt Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.systemPrompt}
                    onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                    placeholder="Define the agent's behavior, personality, and capabilities..."
                  />
                </div>

                {/* LLM Provider Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LLM Provider *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.llmProvider}
                      onChange={(e) => handleInputChange('llmProvider', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a provider...</option>
                      {llmProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, addTag)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., coding, writing, analysis"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
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
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-blue-200 rounded-full p-1 transition-colors"
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

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isFormValid
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Test Agent: {selectedAgent.name}</h2>
                <p className="text-gray-600 mt-1">{selectedAgent.description}</p>
                {selectedAgent.mcpServers.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Connected MCP Servers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.mcpServers.map((serverId, index) => {
                        const server = mcpServers.find(s => s.id === serverId);
                        return server ? (
                          <span
                            key={`test-server-${index}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                          >
                            <Server className="h-3 w-3" />
                            {server.name} ({server.tools.length} tools)
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Available Tools:</span>
                      <div className="text-xs text-gray-600 mt-1">
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
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          testQuery.trim() && !isTestingAgent
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
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-3">{result.query}</p>
                        
                        {/* Show tool calls if any */}
                        {result.toolCalls && result.toolCalls.length > 0 && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                            <strong className="text-sm text-blue-700">Tool Calls:</strong>
                            {result.toolCalls.map((toolCall, toolIndex) => (
                              <div key={toolIndex} className="mt-2 p-2 bg-white rounded border-l-4 border-blue-300">
                                <div className="text-sm font-medium text-blue-800">
                                  🔧 {toolCall.toolName}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  <strong>Args:</strong> {JSON.stringify(toolCall.args, null, 2)}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  <strong>Result:</strong> {JSON.stringify(toolCall.result, null, 2)}
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

export default AIAgentsPage;