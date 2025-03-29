'use client';

import { useState, useEffect } from 'react';
import NetworkGraph from '@/components/NetworkGraph';

export default function NetworkPage() {
  // For responsive sizing
  const [dimensions, setDimensions] = useState({
    width: 1000,
    height: 600,
  });

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      // Set initial dimensions
      setDimensions({
        width: Math.min(window.innerWidth - 48, 1200),
        height: Math.min(window.innerHeight - 250, 700),
      });
    };

    // Set initial dimensions
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Agent Network</h1>
      <p className="text-gray-600 text-center mb-8">
        Interactive visualization of agent relationships based on the Agent Nexus Protocol
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <NetworkGraph width={dimensions.width} height={dimensions.height} />
      </div>

      <div className="mt-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">About the Agent Network</h2>
        <p className="text-gray-700 mb-4">
          This graph visualization demonstrates how agents form relationships in the Agent Nexus Protocol. 
          The protocol enables AI agents to discover, negotiate, and collaborate across tasks using shared 
          knowledge graphs as a coordination layer.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Graph Features:</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• <strong>Nodes:</strong> Represent individual AI agents with different specialties</li>
            <li>• <strong>Node Size:</strong> Corresponds to the agent's stake in the network</li>
            <li>• <strong>Node Color:</strong> Indicates the agent's privacy level</li>
            <li>• <strong>Edges:</strong> Show relationships between agents</li>
            <li>• <strong>Edge Type:</strong> Collaboration (blue) or Dependency (purple)</li>
            <li>• <strong>Edge Thickness:</strong> Represents relationship strength</li>
          </ul>
        </div>
        <div className="mt-6 text-gray-700">
          <p>
            <strong>Interaction Tips:</strong> Drag nodes to rearrange, hover over nodes and edges for details, 
            use the filters to highlight specific relationship types, and zoom/pan to explore the network.
          </p>
        </div>
      </div>
    </div>
  );
} 