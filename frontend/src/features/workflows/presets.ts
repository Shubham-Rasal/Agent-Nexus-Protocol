import { Workflow, NODE_TYPES } from './registry/types';

export const PRESET_WORKFLOWS: Workflow[] = [
  {
    id: 'lead_qualification_workflow',
    name: 'Lead Qualification Workflow',
    description: 'Automatically qualify leads and schedule meetings with qualified prospects',
    nodes: [
      {
        id: 'trigger_1',
        type: NODE_TYPES.TRIGGER,
        position: { x: 100, y: 100 },
        data: {
          label: 'Text Message Trigger',
          type: NODE_TYPES.TRIGGER,
          description: 'Triggered by a text message',
          config: {
            triggerType: 'text'
          },
          outputs: {
            message: 'The input text message'
          }
        }
      },
      {
        id: 'agent_qualifier',
        type: NODE_TYPES.AGENT,
        position: { x: 100, y: 250 },
        data: {
          label: 'Lead Qualifier',
          type: NODE_TYPES.AGENT,
          description: 'Analyzes lead quality',
          config: {
            agentId: 'lead-qualifier'
          },
          inputs: {
            message: 'The input message to analyze'
          },
          outputs: {
            score: 'Lead qualification score (0-100)',
            analysis: {
              positiveKeywords: 'Number of positive keywords found',
              negativeKeywords: 'Number of negative keywords found',
              text: 'Analyzed text'
            }
          }
        }
      },
      {
        id: 'condition_score',
        type: NODE_TYPES.CONDITION,
        position: { x: 100, y: 400 },
        data: {
          label: 'Check Score',
          type: NODE_TYPES.CONDITION,
          description: 'Check if lead score is high enough',
          config: {
            condition: 'score >= 70'
          }
        }
      },
      {
        id: 'agent_scheduler',
        type: NODE_TYPES.AGENT,
        position: { x: -50, y: 550 },
        data: {
          label: 'Meeting Scheduler',
          type: NODE_TYPES.AGENT,
          description: 'Schedule meeting with qualified lead',
          config: {
            agentId: 'meeting-scheduler'
          },
          inputs: {
            score: 'Lead qualification score',
            message: 'Original message for context'
          },
          outputs: {
            meetingScheduled: 'Whether the meeting was scheduled',
            proposedTime: 'Proposed meeting time',
            duration: 'Meeting duration in minutes',
            type: 'Type of meeting'
          }
        }
      },
      {
        id: 'agent_email',
        type: NODE_TYPES.AGENT,
        position: { x: 250, y: 550 },
        data: {
          label: 'Email Outreach',
          type: NODE_TYPES.AGENT,
          description: 'Send follow-up email',
          config: {
            agentId: 'email-outreach'
          },
          inputs: {
            score: 'Lead qualification score',
            message: 'Original message for context'
          },
          outputs: {
            emailSent: 'Whether the email was sent successfully',
            template: 'Email template used',
            message: 'Email message content'
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'agent_qualifier',
        type: 'conditional'
      },
      {
        id: 'edge_2',
        source: 'agent_qualifier',
        target: 'condition_score',
        type: 'conditional'
      },
      {
        id: 'edge_3',
        source: 'condition_score',
        target: 'agent_scheduler',
        sourceHandle: 'yes',
        label: 'Yes',
        type: 'conditional'
      },
      {
        id: 'edge_4',
        source: 'condition_score',
        target: 'agent_email',
        sourceHandle: 'no',
        label: 'No',
        type: 'conditional'
      }
    ],
    domains: ['lead_generation'],
    capabilities: ['automation', 'analysis'],
    author: 'System',
    version: '1.0.0',
    isPublic: true,
    requiredTools: ['email', 'calendar'],
    tags: ['leads', 'qualification', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'email_outreach_workflow',
    name: 'Email Outreach Workflow',
    description: 'Send emails based on text input',
    nodes: [
      {
        id: 'trigger_1',
        type: NODE_TYPES.TRIGGER,
        position: { x: 100, y: 100 },
        data: {
          label: 'Text Input Trigger',
          type: NODE_TYPES.TRIGGER,
          description: 'Triggered by a text message',
          config: {
            triggerType: 'text'
          },
          outputs: {
            message: 'The input text message'
          }
        }
      },
      {
        id: 'agent_email',
        type: NODE_TYPES.AGENT,
        position: { x: 100, y: 250 },
        data: {
          label: 'Email Outreach',
          type: NODE_TYPES.AGENT,
          description: 'Send email based on input',
          config: {
            agentId: 'email-outreach'
          },
          inputs: {
            message: 'The input message to analyze'
          },
          outputs: {
            emailSent: 'Whether the email was sent successfully',
            template: 'Email template used',
            message: 'Email message content'
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'agent_email',
        type: 'conditional'
      }
    ],
    domains: ['communication'],
    capabilities: ['automation', 'communication'],
    author: 'System',
    version: '1.0.0',
    isPublic: true,
    requiredTools: ['email'],
    tags: ['email', 'outreach', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 