"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AgentInfo, Message } from '@/types/chatTypes';

// Type definitions from parent
type Agent = {
  id: string;
  name: string;
  description: string;
  privacy_level: string;
  stake: number;
};

type AgentResponseProps = {
  message?: Message;
  agent?: AgentInfo;
  content?: string;
  loading?: boolean;
  isThought?: boolean;
};

export default function AgentResponse({ message, agent, content, loading, isThought }: AgentResponseProps) {
  if (!agent) return null;
  
  // Get message content either from props or from message object
  const messageContent = content || (message?.content || '');
  const isMessageLoading = loading || message?.isLoading || false;
  const showAsThought = isThought || message?.isThought;
  
  // Get the agent's privacy level color
  const getPrivacyLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  
  // Get agent type from ID (e.g., "legal" from "agent_legal_gdpr")
  const agentType = agent.id.split('_')[1];
  
  // Generate a background color based on agent type
  const getBgColor = () => {
    // If this is a thought message, use a lighter background
    if (showAsThought) {
      return 'bg-gray-50 border-gray-100 italic';
    }
    
    switch (agentType) {
      case 'legal': return 'bg-blue-50 border-blue-200';
      case 'finance': 
      case 'crypto': 
      case 'realestate': return 'bg-green-50 border-green-200';
      case 'health': 
      case 'food': return 'bg-red-50 border-red-200';
      case 'tech': 
      case 'cyber': 
      case 'ai': return 'bg-indigo-50 border-indigo-200';
      case 'gmail':
      case 'email': return 'bg-purple-50 border-purple-200';
      case 'lead':
      case 'qualifier': return 'bg-amber-50 border-amber-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className="flex mb-4">
      <div className={`p-3 rounded-lg max-w-4xl border shadow-sm ${getBgColor()}`}>
        <div className="flex items-center mb-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2 border border-gray-200">
            <span className="text-xs font-medium">{agent.name.substring(0, 2)}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{agent.name}</p>
            <div className="flex items-center">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPrivacyLevelColor(agent.privacy_level)}`}>
                {agent.privacy_level}
              </span>
              <span className="text-xs text-gray-500 ml-2">Stake: {agent.stake}</span>
              {showAsThought && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full ml-2">Thought Process</span>}
            </div>
          </div>
        </div>
        
        {isMessageLoading ? (
          <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-50 rounded border border-gray-100">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-500">Working on task...</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>
              {messageContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
} 