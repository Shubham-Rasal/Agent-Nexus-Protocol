"use client";
import React, { useState } from 'react';
import { Plus, X, ChevronDown, Settings, Trash2, Play, Bot } from 'lucide-react';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Initialize AI providers
const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || 'your-api-key-here',
});

interface AgentData {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  llmProvider: string;
  tools: string[];
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface TestResult {
  agentId: string;
  query: string;
  response: string;
  timestamp: string;
}

const AIAgentManager: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
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
    tools: []
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      systemPrompt: '',
      tags: [],
      llmProvider: '',
      tools: []
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

  const handleInputChange = (field: keyof Omit<AgentData, 'id' | 'createdAt' | 'usageCount'>, value: string) => {
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

  const addTool = () => {
    if (toolInput.trim() && !formData.tools.includes(toolInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tools: [...prev.tools, toolInput.trim()]
      }));
      setToolInput('');
    }
  };

  const removeTool = (toolToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter(tool => tool !== toolToRemove)
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
    try {
      // For now, only Google Gemini is implemented
      // You can extend this to support other providers
      let response = '';
      
      if (selectedAgent.llmProvider === 'google') {
        const { text } = await generateText({
          model: google("models/gemini-1.5-flash"),
          prompt: `${selectedAgent.systemPrompt}\n\nUser query: ${testQuery}`,
        });
        response = text;
      } else {
        response = `Testing with ${selectedAgent.llmProvider} is not yet implemented. This is a mock response for agent "${selectedAgent.name}". Query: "${testQuery}"`;
      }

      const testResult: TestResult = {
        agentId: selectedAgent.id,
        query: testQuery,
        response,
        timestamp: new Date().toISOString()
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
    }
    setIsTestingAgent(false);
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

  // Function to execute an agent (this would be called by your chatbot)
  const executeAgent = async (agentId: string, userQuery: string): Promise<string> => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    if (agent.llmProvider === 'google') {
      const { text } = await generateText({
        model: google("models/gemini-1.5-flash"),
        prompt: `${agent.systemPrompt}\n\nUser query: ${userQuery}`,
      });
      
      // Update usage stats
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, usageCount: a.usageCount + 1, lastUsed: new Date().toISOString() }
          : a
      ));
      
      return text;
    }
    
    throw new Error(`Provider ${agent.llmProvider} not implemented`);
  };

  const isFormValid = formData.name && formData.description && formData.systemPrompt && formData.llmProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Agent Management System</h1>
          <p className="text-gray-600 mb-6">Create, test, and manage custom AI agents for your chatbot</p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create Agent
          </button>
        </div>

        {/* Stats */}
        {agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
              <div className="text-sm text-gray-500">Total Agents</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {agents.reduce((sum, agent) => sum + agent.usageCount, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Executions</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{testResults.length}</div>
              <div className="text-sm text-gray-500">Test Runs</div>
            </div>
          </div>
        )}

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
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">LLM Provider</span>
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
                        {agent.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.tools.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tools</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.tools.map(tool => (
                          <span
                            key={tool}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a provider...</option>
                      {llmProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
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
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
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

                {/* Tools Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Tools
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={toolInput}
                        onChange={(e) => setToolInput(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, addTool)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., web_search, calculator, file_reader"
                      />
                      <button
                        type="button"
                        onClick={addTool}
                        className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                    {formData.tools.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tools.map(tool => (
                          <span
                            key={tool}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {tool}
                            <button
                              type="button"
                              onClick={() => removeTool(tool)}
                              className="hover:bg-green-200 rounded-full p-1 transition-colors"
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
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <strong className="text-sm text-gray-700">Query:</strong>
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-3">{result.query}</p>
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

export default AIAgentManager;