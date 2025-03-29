'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import agentsData from '@/app/agents.json';

interface Agent {
  id: string;
  name: string;
  description: string;
  knowledge_sources: string[];
  tools: string[];
  stake: number;
  privacy_level: 'low' | 'medium' | 'high' | 'critical';
}

const privacyLevelColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function AgentDetails({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Find the agent with the matching ID
    const foundAgent = agentsData.agents.find(a => a.id === params.id);
    
    if (foundAgent) {
      setAgent(foundAgent);
    }
    
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
        <p className="mb-6">We couldn't find an agent with the ID: {params.id}</p>
        <Link 
          href="/agents" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/agents" 
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Directory
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <span className={`${privacyLevelColors[agent.privacy_level as keyof typeof privacyLevelColors]} px-3 py-1 rounded-full text-sm font-medium`}>
            {agent.privacy_level.charAt(0).toUpperCase() + agent.privacy_level.slice(1)} Privacy
          </span>
        </div>
        
        <div className="mb-8">
          <p className="text-gray-700 text-lg">{agent.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Knowledge Sources</h2>
            <ul className="space-y-3">
              {agent.knowledge_sources.map((source, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <span className="block font-medium">{source}</span>
                    <span className="text-gray-500 text-sm">{source.startsWith('recall:') ? 'Knowledge Graph' : source.startsWith('akave:') ? 'Live Data Feed' : 'Static Storage'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Tools</h2>
            <ul className="space-y-3">
              {agent.tools.map((tool, index) => (
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
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Stake Amount:</span>
              <span className="ml-2 text-2xl font-bold">${agent.stake.toLocaleString()}</span>
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              Deploy Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 