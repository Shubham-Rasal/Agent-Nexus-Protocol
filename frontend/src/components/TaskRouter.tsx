"use client";

import React from 'react';
import { GitBranch, Network, Terminal, Users, Sigma, Send } from 'lucide-react';

type TaskRouterProps = {
  isActive?: boolean;
}

export default function TaskRouter({ isActive = false }: TaskRouterProps) {
  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm ${isActive ? 'ring-2 ring-purple-400' : ''}`}>
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
          <Network className="h-4 w-4 text-purple-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800">Task Router</h4>
        {isActive && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs">Active</span>
        )}
      </div>
      
      <div className="text-xs text-gray-600 mb-4">
        Analyzes queries and distributes work to specialized agents based on capabilities, stake, and relationship strengths
      </div>
      
      {/* Router Steps Visualization */}
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <Terminal className="h-3 w-3 text-blue-600" />
          </div>
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-medium">LLM Decomposition</span>
            <div className="text-[10px] text-gray-500">Breaks queries into subtasks via LLM reasoning</div>
          </div>
        </div>
        
        <div className="h-4 border-l border-dashed border-gray-300 ml-3"></div>
        
        <div className="flex items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
            <Users className="h-3 w-3 text-green-600" />
          </div>
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-medium">Agent Matching</span>
            <div className="text-[10px] text-gray-500">Finds optimal agents via semantic matching &amp; stake weight</div>
          </div>
        </div>
        
        <div className="h-4 border-l border-dashed border-gray-300 ml-3"></div>
        
        <div className="flex items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-2">
            <Sigma className="h-3 w-3 text-amber-600" />
          </div>
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-medium">Graph Traversal</span>
            <div className="text-[10px] text-gray-500">Considers agent relationships (collab, dependency)</div>
          </div>
        </div>
        
        <div className="h-4 border-l border-dashed border-gray-300 ml-3"></div>
        
        <div className="flex items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
            <Send className="h-3 w-3 text-purple-600" />
          </div>
          <div className="flex-1 text-xs text-gray-700">
            <span className="font-medium">Task Assignment</span>
            <div className="text-[10px] text-gray-500">Assigns subtasks to the optimal agent team</div>
          </div>
        </div>
      </div>
      
      {/* Scoring method explanation */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h5 className="text-xs font-medium text-gray-700 mb-2">Agent Selection Factors</h5>
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 text-[10px] bg-blue-50 text-blue-700 rounded">
            Domain Match <span className="ml-1 opacity-70">60%</span>
          </div>
          <div className="px-2 py-1 text-[10px] bg-green-50 text-green-700 rounded">
            Agent Stake <span className="ml-1 opacity-70">30%</span>
          </div>
          <div className="px-2 py-1 text-[10px] bg-amber-50 text-amber-700 rounded">
            Relationships <span className="ml-1 opacity-70">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
} 