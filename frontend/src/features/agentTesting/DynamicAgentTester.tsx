'use client';

import { AgentTester } from '@/features/emailOutreach/AgentTester';
import { DataAnalyzerAgent } from '@/features/dataAnalyzer/DataAnalyzerAgent';
import { MeetingSchedulerTester } from '@/features/agents/meeting/MeetingSchedulerTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Mail, FileSpreadsheet, Globe, Calendar, Database } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  storageProvider: string;
  tools: string[];
  systemPrompt?: string;
}

interface DynamicAgentTesterProps {
  agent: Agent;
}

export function DynamicAgentTester({ agent }: DynamicAgentTesterProps) {
  // Track if component is mounted to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get agent type based on ID or tools
  const getAgentType = () => {
    if (agent.id === 'email-outreach' || agent.tools.includes('gmail-send')) {
      return 'email';
    } else if (agent.id === 'data-analyzer' || 
               (agent.tools.includes('csv-processor') && agent.tools.includes('akave-storage'))) {
      return 'data';
    } else if (agent.id === 'meeting-scheduler' || 
              (agent.tools.includes('google-meet') && agent.tools.includes('gmail-send'))) {
      return 'scheduler';
    } else if (agent.id === 'lead-qualifier' ||
              (agent.tools.includes('data-aggregate'))) {
      return 'qualifier';
    } else {
      return 'generic';
    }
  };

  // Render icon based on agent type
  const renderIcon = () => {
    const type = getAgentType();
    
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'data':
        return <FileSpreadsheet className="h-5 w-5 text-purple-500" />;
      case 'scheduler':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'qualifier':
        return <Database className="h-5 w-5 text-amber-500" />;
      default:
        return <BrainCircuit className="h-5 w-5 text-gray-500" />;
    }
  };

  // Determine which agent tester to render based on agent type
  const renderAgentTester = () => {
    // Don't render anything until client-side
    if (!isMounted) return null;
    
    const type = getAgentType();
    
    switch (type) {
      case 'email':
        return <AgentTester />;
      case 'data':
        // Render the full version of the data analyzer with all features including storage
        return <DataAnalyzerAgent />;
      case 'scheduler':
        // Use the dedicated Meeting Scheduler Tester
        return <MeetingSchedulerTester />;
      default:
        // Generic testing interface for other agent types
        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {renderIcon()}
                <CardTitle className="text-base">Test {agent.name}</CardTitle>
              </div>
              <CardDescription>
                This agent doesn't have a specialized testing interface yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 p-3 rounded border border-amber-100">
                  <p className="text-sm text-amber-800">
                    The testing interface for this agent type is under development.
                    You can test its capabilities by creating a full interaction flow.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h4 className="text-sm font-medium mb-2">Available Tools:</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.map(tool => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // Generate description based on agent type
  const getTestDescription = () => {
    const type = getAgentType();
    
    switch (type) {
      case 'email':
        return "This agent can analyze natural language descriptions to extract contact information and send personalized emails.";
      case 'data':
        return "This agent can analyze CSV data with natural language instructions to extract insights, transform data, and save results to decentralized storage.";
      case 'scheduler':
        return "This agent can coordinate and schedule meetings between team members and potential clients.";
      case 'qualifier':
        return "This agent can analyze lead data and score potential customers based on defined criteria.";
      default:
        return `This test interface allows you to experiment with ${agent.name}'s capabilities.`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          {renderIcon()}
          <h3 className="text-lg font-semibold">Test {agent.name}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {getTestDescription()}
        </p>
      </div>
      
      {renderAgentTester()}
    </div>
  );
} 