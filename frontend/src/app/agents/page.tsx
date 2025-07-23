"use client"
import React, { useState } from 'react';
import { Plus, X, ChevronDown, Settings, Trash2 } from 'lucide-react';

interface AgentData {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  llmProvider: string;
  tools: string[];
  createdAt: string;
}

const AgentNetworkProtocol: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<AgentData, 'id' | 'createdAt'>>({
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
    'OpenAI',
    'Anthropic',
    'Gemini',
    'Cohere',
    'Mistral',
    'Ollama',
    'Hugging Face'
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

  const handleInputChange = (field: keyof Omit<AgentData, 'id' | 'createdAt'>, value: string) => {
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
      createdAt: new Date().toISOString()
    };

    setAgents(prev => [newAgent, ...prev]);
    closeModal();
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const deleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
  };

  const isFormValid = formData.name && formData.description && formData.systemPrompt && formData.llmProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agentic Library</h1>          
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create Agent
          </button>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="text-center py-16">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">LLM Provider</span>
                    <p className="text-sm text-gray-800 mt-1">{agent.llmProvider}</p>
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

        {/* Modal */}
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
                    placeholder="Enter agent name..."
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
                    placeholder="Brief one-line description of the agent..."
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
                        <option key={provider} value={provider}>{provider}</option>
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
                        placeholder="Add a tag..."
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
                        placeholder="Add a tool..."
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
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentNetworkProtocol;