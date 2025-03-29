"use client";

import React from 'react';

// Type definitions from parent
type Agent = {
  id: string;
  name: string;
  description: string;
  knowledge_sources: string[];
  tools: string[];
  privacy_level: string;
  stake: number;
};

type SubTask = {
  id: string;
  description: string;
  agent: Agent;
  status: 'pending' | 'in-progress' | 'completed';
  response?: string;
};

type AgentStatusProps = {
  task: SubTask;
};

export default function AgentStatus({ task }: AgentStatusProps) {
  // Generate status badge
  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full flex items-center">
            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
            Working
          </span>
        );
      case 'completed':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-600 rounded-full flex items-center">
            <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Done
          </span>
        );
    }
  };
  
  // Get agent type from ID (e.g., "legal" from "agent_legal_gdpr")
  const agentType = task.agent.id.split('_')[1];
  
  // Generate a border color based on agent type
  const getBorderColor = () => {
    switch (agentType) {
      case 'legal': return 'border-blue-200';
      case 'finance': 
      case 'crypto': 
      case 'realestate': return 'border-green-200';
      case 'health': 
      case 'food': return 'border-red-200';
      case 'tech': 
      case 'cyber': 
      case 'ai': return 'border-indigo-200';
      default: return 'border-gray-200';
    }
  };
  
  return (
    <div className={`bg-white rounded-md border ${getBorderColor()} p-2 mb-2 text-sm hover:shadow-sm transition-shadow`}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-medium text-gray-700 truncate max-w-[70%]">{task.agent.name}</span>
        {getStatusBadge()}
      </div>
      
      <p className="text-xs text-gray-600 mb-1.5">{task.description}</p>
      
      {/* Show knowledge sources and tools on completed tasks */}
      {task.status === 'completed' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1 mb-1">
            {task.agent.knowledge_sources.slice(0, 2).map((source, i) => (
              <span key={i} className="px-1 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">
                {source.split(':')[0]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {task.agent.tools.slice(0, 2).map((tool, i) => (
              <span key={i} className="px-1 py-0.5 bg-gray-50 text-gray-700 text-xs rounded border border-gray-100">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 