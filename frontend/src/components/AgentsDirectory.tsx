'use client';

import { useState, useEffect } from 'react';
import agentsData from '@/app/agents.json';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';

// Define TypeScript interfaces for our data structure
interface Agent {
  id: string;
  name: string;
  description: string;
  knowledge_sources: string[];
  tools: string[];
  stake: number;
  privacy_level: 'low' | 'medium' | 'high' | 'critical';
  isCustom?: boolean;
}

type PrivacyLevel = 'low' | 'medium' | 'high' | 'critical';
type AgentCategory = 'all' | 'custom' | 'legal' | 'finance' | 'health' | 'tech' | 'security' | 'education';

const privacyLevelColors: Record<PrivacyLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const categories: { id: AgentCategory; label: string; description?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom Agents', description: 'Agents you\'ve created' },
  { id: 'legal', label: 'Legal Agents', description: 'Compliance & regulatory' },
  { id: 'finance', label: 'Finance', description: 'Financial analysis & tax' },
  { id: 'health', label: 'Healthcare', description: 'Medical & wellness' },
  { id: 'tech', label: 'Technology', description: 'Code & patents' },
  { id: 'security', label: 'Security', description: 'Cybersecurity & fraud' },
  { id: 'education', label: 'Education', description: 'Learning & research' }
];

// Helper function to determine category
const getAgentCategory = (agent: Agent): AgentCategory => {
  if (agent.isCustom) return 'custom';
  
  // Logic to categorize based on agent properties
  if (agent.id.includes('legal') || agent.description.toLowerCase().includes('law') || agent.description.toLowerCase().includes('compliance')) 
    return 'legal';
  if (agent.id.includes('finance') || agent.id.includes('tax') || agent.description.toLowerCase().includes('financial')) 
    return 'finance';
  if (agent.id.includes('health') || agent.id.includes('medical') || agent.description.toLowerCase().includes('patient')) 
    return 'health';
  if (agent.id.includes('tech') || agent.id.includes('patent') || agent.description.toLowerCase().includes('code')) 
    return 'tech';
  if (agent.id.includes('security') || agent.id.includes('cyber') || agent.description.toLowerCase().includes('threat')) 
    return 'security';
  if (agent.id.includes('education') || agent.description.toLowerCase().includes('learning') || agent.description.toLowerCase().includes('academic')) 
    return 'education';
  
  return 'all';
};

export default function AgentsDirectory() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AgentCategory>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stake'>('name');
  
  // State for the selected agent displayed in the sidebar
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    // Function to load both predefined and custom agents
    const loadAllAgents = () => {
      // Load predefined agents from JSON
      const predefinedAgents = (agentsData.agents as unknown as Agent[]).map(agent => ({
        ...agent,
        isCustom: false
      }));
      
      // Get custom agents from localStorage (if available)
      let customAgents: Agent[] = [];
      
      // This check is necessary for SSR compatibility
      if (typeof window !== 'undefined') {
        try {
          const customAgentsJson = localStorage.getItem('customAgents');
          if (customAgentsJson) {
            customAgents = JSON.parse(customAgentsJson).map((agent: Agent) => ({
              ...agent,
              isCustom: true
            }));
          }
        } catch (error) {
          console.error('Error loading custom agents from localStorage:', error);
        }
      }
      
      // Combine both agent sources
      setAgents([...predefinedAgents, ...customAgents]);
    };
    
    // Initial load
    loadAllAgents();
    
    // Set up event listener for storage changes (if another tab updates)
    const handleStorageChange = () => {
      loadAllAgents();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Filter and sort agents based on search term, privacy filter, category filter and sort order
  const filteredAgents = agents
    .filter(agent => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply privacy filter
      const matchesPrivacy = privacyFilter === 'all' || agent.privacy_level === privacyFilter;
      
      // Apply category filter
      const matchesCategory = categoryFilter === 'all' || 
        (categoryFilter === 'custom' ? agent.isCustom : getAgentCategory(agent) === categoryFilter);
      
      return matchesSearch && matchesPrivacy && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.stake - a.stake; // Sort by stake in descending order
      }
    });

  // Function to handle clicking on an agent
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  // Function to close the sidebar
  const closeSidebar = () => {
    setSelectedAgent(null);
  };

  return (
    <div className="px-1 py-2 flex">
      {/* Main content column */}
      <div className={`transition-all duration-300 ${selectedAgent ? 'w-2/3 pr-4' : 'w-full'}`}>
        {/* Header section with Create button */}
        <div className="flex justify-end items-center mb-8">
          <Link href="/agents/create">
            <Button className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Custom Agent
            </Button>
          </Link>
        </div>

        {/* Category filter buttons */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={`py-3 px-4 border rounded-lg transition-colors text-left ${
                  categoryFilter === category.id 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium">{category.label}</div>
                {category.description && (
                  <div className={`text-xs mt-1 ${categoryFilter === category.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {category.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced filters */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                id="search"
                className="w-full p-2.5 border rounded-lg"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="privacyFilter" className="block text-sm font-medium mb-1">Privacy Level</label>
              <select
                id="privacyFilter"
                className="w-full p-2.5 border rounded-lg bg-white"
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value as PrivacyLevel | 'all')}
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium mb-1">Sort By</label>
              <select
                id="sortBy"
                className="w-full p-2.5 border rounded-lg bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'stake')}
              >
                <option value="name">Name</option>
                <option value="stake">Stake Amount</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <p className="mb-5 text-gray-600 font-medium">
          Showing {filteredAgents.length} of {agents.length} agents
        </p>
        
        {/* Agent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => handleAgentClick(agent)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{agent.name}</h2>
                  <div className="flex items-center gap-2">
                    {agent.isCustom && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full">
                        Custom
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full ${privacyLevelColors[agent.privacy_level]}`}>
                      {agent.privacy_level}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-5">{agent.description}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Knowledge Sources:</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.knowledge_sources.map((source, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Tools:</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.map((tool, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Stake:</span>
                    <span className="ml-1.5 font-semibold">${agent.stake.toLocaleString()}</span>
                  </div>
                  <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click event
                      handleAgentClick(agent);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg my-8">
            <p className="text-gray-500 text-lg mb-3">No agents found matching your criteria</p>
            <button 
              className="py-2 px-4 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => {
                setSearchTerm('');
                setPrivacyFilter('all');
                setCategoryFilter('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Agent Details Sidebar */}
      {selectedAgent && (
        <div className="w-1/3 border-l bg-white transition-all duration-300 transform h-screen fixed top-0 right-0 overflow-y-auto shadow-lg p-6">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={closeSidebar}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="pt-6">
            <div className="flex items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{selectedAgent.name}</h1>
                <span className={`inline-block mt-2 ${privacyLevelColors[selectedAgent.privacy_level]} px-3 py-1 rounded-full text-sm font-medium`}>
                  {selectedAgent.privacy_level.charAt(0).toUpperCase() + selectedAgent.privacy_level.slice(1)} Privacy
                </span>
                {selectedAgent.isCustom && (
                  <span className="ml-2 inline-block mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Custom Agent
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-700">{selectedAgent.description}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Knowledge Sources</h2>
              <ul className="space-y-3">
                {selectedAgent.knowledge_sources.map((source, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <span className="block font-medium">{source}</span>
                      <span className="text-gray-500 text-sm">
                        {source.startsWith('recall:') ? 'Knowledge Graph' : 
                        source.startsWith('akave:') ? 'Live Data Feed' : 
                        source.startsWith('storache:') ? 'Static Storage' : 'External Source'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Tools</h2>
              <ul className="space-y-3">
                {selectedAgent.tools.map((tool, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <span className="block font-medium">{tool}</span>
                      <span className="text-gray-500 text-sm">Active Tool</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <div className="flex flex-col space-y-4">
                <div>
                  <span className="text-gray-600">Stake Amount:</span>
                  <span className="ml-2 text-2xl font-bold">${selectedAgent.stake.toLocaleString()}</span>
                </div>
                <Button className="w-full">Deploy Agent</Button>
                {selectedAgent.isCustom && (
                  <Button variant="outline" className="w-full">Edit Agent</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 