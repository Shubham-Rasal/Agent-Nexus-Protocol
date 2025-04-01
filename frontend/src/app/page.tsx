import Link from 'next/link';
import AgentCreationFeature from '@/components/AgentCreationFeature';

export default function Home() {
  return (
    <div className="h-full w-full p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome to AI Network Platform</h1>
        <p className="text-gray-600 mb-6">
          Leverage multiple AI agents working together to solve complex problems.
        </p>
        
        <div className="mb-10">
          <AgentCreationFeature />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Multi-Agent Chat</h2>
            <p className="text-gray-600 mb-4">
              Chat with multiple specialized AI agents working together to answer your questions.
            </p>
            <a href="/chat" className="text-blue-600 hover:underline font-medium">Try it now →</a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Agent Directory</h2>
            <p className="text-gray-600 mb-4">
              Browse our collection of specialized AI agents with different capabilities.
            </p>
            <a href="/agents" className="text-blue-600 hover:underline font-medium">View agents →</a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Agent Network</h2>
            <p className="text-gray-600 mb-4">
              Visualize how different agents interact and collaborate with each other.
            </p>
            <a href="/network" className="text-blue-600 hover:underline font-medium">See network →</a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Tools</h2>
            <p className="text-gray-600 mb-4">
              Browse our collection of tools that can be used to create and manage agents.
            </p>
            <a href="/tools" className="text-blue-600 hover:underline font-medium">View tools →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
