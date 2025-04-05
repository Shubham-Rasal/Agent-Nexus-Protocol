'use client';

import { useEffect } from 'react';
import { EnhancedMultiAgentChat } from '@/components/EnhancedMultiAgentChat';
import { workflowRegistry } from '@/features/workflows/registry/registry';
import { Workflow, WorkflowDomainType, WorkflowCapabilityType } from '@/features/workflows/registry/types';

// Sample workflows for demonstration purposes
const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: 'workflow_recruitment',
    name: 'Recruitment Workflow',
    description: 'Source, screen, and engage with potential candidates',
    domains: [WorkflowDomainType.RECRUITMENT],
    capabilities: [
      WorkflowCapabilityType.AUTOMATION,
      WorkflowCapabilityType.ANALYSIS
    ],
    author: 'ANP Team',
    version: '1.0.0',
    isPublic: true,
    requiredTools: ['linkedin-search', 'talent-database'],
    tags: ['recruiting', 'hiring', 'talent'],
    nodes: [
      {
        id: 'trigger_start',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          type: 'trigger',
          description: 'Workflow start'
        }
      },
      {
        id: 'agent_research',
        type: 'agent',
        position: { x: 100, y: 200 },
        data: {
          label: 'Candidate Search',
          type: 'agent',
          description: 'Find potential candidates',
          config: {
            agentId: 'agent_hr_recruiter'
          }
        }
      },
      {
        id: 'agent_qualify',
        type: 'agent',
        position: { x: 100, y: 300 },
        data: {
          label: 'Candidate Screening',
          type: 'agent',
          description: 'Screen candidates based on criteria',
          config: {
            agentId: 'agent_hr_recruiter'
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_start',
        target: 'agent_research'
      },
      {
        id: 'edge_2',
        source: 'agent_research',
        target: 'agent_qualify'
      }
    ]
  },
  {
    id: 'workflow_research',
    name: 'Market Research',
    description: 'Conduct comprehensive market research and competitive analysis',
    domains: [WorkflowDomainType.RESEARCH],
    capabilities: [
      WorkflowCapabilityType.ANALYSIS,
      WorkflowCapabilityType.GENERATION
    ],
    author: 'ANP Team',
    version: '1.0.0',
    isPublic: true,
    requiredTools: ['web-search', 'market-data'],
    tags: ['market analysis', 'competition', 'trends'],
    nodes: [
      {
        id: 'trigger_start',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          type: 'trigger',
          description: 'Workflow start'
        }
      },
      {
        id: 'agent_market',
        type: 'agent',
        position: { x: 100, y: 200 },
        data: {
          label: 'Market Overview',
          type: 'agent',
          description: 'Generate market overview',
          config: {
            agentId: 'agent_1'
          }
        }
      },
      {
        id: 'agent_competitors',
        type: 'agent',
        position: { x: 100, y: 300 },
        data: {
          label: 'Competitor Analysis',
          type: 'agent',
          description: 'Analyze competitors',
          config: {
            agentId: 'agent_2'
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_start',
        target: 'agent_market'
      },
      {
        id: 'edge_2',
        source: 'agent_market',
        target: 'agent_competitors'
      }
    ]
  },
  {
    id: 'workflow_content',
    name: 'Content Creation',
    description: 'Generate ideas and create content for various platforms',
    domains: [WorkflowDomainType.CONTENT_CREATION],
    capabilities: [
      WorkflowCapabilityType.GENERATION,
      WorkflowCapabilityType.INTERACTION
    ],
    author: 'ANP Team',
    version: '1.0.0',
    isPublic: true,
    requiredTools: ['text-generator', 'image-search'],
    tags: ['content', 'social media', 'blog'],
    nodes: [
      {
        id: 'trigger_start',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          type: 'trigger',
          description: 'Workflow start'
        }
      },
      {
        id: 'agent_ideation',
        type: 'agent',
        position: { x: 100, y: 200 },
        data: {
          label: 'Content Ideation',
          type: 'agent',
          description: 'Generate content ideas',
          config: {
            agentId: 'agent_1'
          }
        }
      },
      {
        id: 'agent_creation',
        type: 'agent',
        position: { x: 100, y: 300 },
        data: {
          label: 'Content Creation',
          type: 'agent',
          description: 'Create content based on ideas',
          config: {
            agentId: 'agent_2'
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_start',
        target: 'agent_ideation'
      },
      {
        id: 'edge_2',
        source: 'agent_ideation',
        target: 'agent_creation'
      }
    ]
  }
];

export default function WorkflowsPage() {
  // Register sample workflows on component mount
  useEffect(() => {
    // Check if workflows are already registered
    const existingWorkflows = workflowRegistry.listWorkflows();
    
    if (existingWorkflows.length === 0) {
      // Register sample workflows
      SAMPLE_WORKFLOWS.forEach(workflow => {
        workflowRegistry.registerWorkflow(workflow);
      });
      
      console.log('Sample workflows registered');
    }
  }, []);
  
  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <EnhancedMultiAgentChat />
    </div>
  );
} 