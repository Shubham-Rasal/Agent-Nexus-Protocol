'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import agentsData from '@/app/agents.json';

// Define TypeScript interfaces for our data structure
interface Agent {
  id: string;
  name: string;
  description: string;
  knowledge_sources: string[];
  tools: string[];
  stake: number;
  privacy_level: 'low' | 'medium' | 'high' | 'critical';
}

type PrivacyLevel = 'low' | 'medium' | 'high' | 'critical';

const privacyLevelColors: Record<PrivacyLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function AgentsDirectory() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stake'>('name');

  useEffect(() => {
    // Load the agents data with proper type assertion
    setAgents(agentsData.agents as unknown as Agent[]);
  }, []);
  
  // Filter and sort agents based on search term, privacy filter, and sort order
  const filteredAgents = agents
    .filter(agent => 
      (searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) && 
      (privacyFilter === 'all' || agent.privacy_level === privacyFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.stake - a.stake; // Sort by stake in descending order
      }
    });

  return (
    <div>
      {/* Filters and search */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="search" className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            id="search"
            className="w-full p-2 border rounded-lg"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="privacyFilter" className="block text-sm font-medium mb-1">Privacy Level</label>
          <select
            id="privacyFilter"
            className="w-full p-2 border rounded-lg"
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
            className="w-full p-2 border rounded-lg"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'stake')}
          >
            <option value="name">Name</option>
            <option value="stake">Stake Amount</option>
          </select>
        </div>
      </div>
      
      {/* Results count */}
      <p className="mb-4 text-gray-600">
        Showing {filteredAgents.length} of {agents.length} agents
      </p>
      
      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div 
            key={agent.id}
            className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${privacyLevelColors[agent.privacy_level]}`}>
                  {agent.privacy_level}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{agent.description}</p>
              
              <div className="mb-3">
                <h3 className="text-sm font-medium mb-1">Knowledge Sources:</h3>
                <div className="flex flex-wrap gap-1">
                  {agent.knowledge_sources.map((source, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <h3 className="text-sm font-medium mb-1">Tools:</h3>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((tool, index) => (
                    <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Stake:</span>
                  <span className="ml-1 font-semibold">${agent.stake.toLocaleString()}</span>
                </div>
                <Link 
                  href={`/agents/${agent.id}`} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No agents found matching your criteria</p>
          <button 
            className="mt-4 text-blue-500 hover:text-blue-700"
            onClick={() => {
              setSearchTerm('');
              setPrivacyFilter('all');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
} 