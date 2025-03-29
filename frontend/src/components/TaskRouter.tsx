"use client";

import React from 'react';
import { GitBranch, Network } from 'lucide-react';

export default function TaskRouter() {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
          <Network className="h-4 w-4 text-purple-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800">Task Router</h4>
      </div>
      
      <div className="text-xs text-gray-600 mb-4">
        Analyzes queries and distributes work to specialized agents
      </div>
      
      {/* Visualization of task decomposition */}
      <div className="flex flex-col items-center mt-2 text-xs">
        <div className="bg-gray-50 w-full p-2 rounded text-center text-gray-800 font-medium border border-gray-200">
          Query
        </div>
        <div className="h-6 border-l border-gray-300"></div>
        <div className="flex items-center justify-center w-full">
          <div className="border-t border-gray-300 w-full"></div>
          <div className="border-l border-gray-300 h-6 -mt-3"></div>
          <div className="border-l border-gray-300 h-6 -mt-3"></div>
          <div className="border-l border-gray-300 h-6 -mt-3"></div>
        </div>
        <div className="flex w-full justify-between">
          <div className="bg-blue-50 p-1.5 rounded border border-blue-100 text-center text-blue-700 text-xs w-[30%]">
            <GitBranch className="h-3 w-3 inline-block mr-1" />
            Subtask 1
          </div>
          <div className="bg-green-50 p-1.5 rounded border border-green-100 text-center text-green-700 text-xs w-[30%]">
            <GitBranch className="h-3 w-3 inline-block mr-1" />
            Subtask 2
          </div>
          <div className="bg-orange-50 p-1.5 rounded border border-orange-100 text-center text-orange-700 text-xs w-[30%]">
            <GitBranch className="h-3 w-3 inline-block mr-1" />
            Subtask 3
          </div>
        </div>
      </div>
    </div>
  );
} 