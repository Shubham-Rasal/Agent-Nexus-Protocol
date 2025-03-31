import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AgentCreationFeature() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Create Your Custom AI Agent</h2>
          
          <p className="text-gray-700 mb-4">
            Build specialized AI agents tailored to your specific needs. Add custom knowledge bases, 
            define system prompts, and connect to our decentralized network.
          </p>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span>
              Upload PDFs, Markdown or Text files as knowledge sources
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span>
              Customize system prompts for specialized behaviors
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span>
              Choose from Storache, Akave or Recall as knowledge providers
            </li>
          </ul>
          
          <Link href="/agents/create">
            <Button className="px-6">
              Create Your Agent
            </Button>
          </Link>
        </div>
        
        <div className="md:w-72 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-medium">My Custom Agent</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                medium
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Knowledge Source:</div>
                <div className="flex gap-1">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    storache:my_data
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">System Prompt:</div>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                  You are a specialized assistant that...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 