import { Workflow, NODE_TYPES } from './schema';
import { generateId } from '@/components/WorkflowUtils';

/**
 * Creates a default lead generation workflow
 */
export function createLeadGenerationWorkflow(): Workflow {
  const triggerId = generateId('trigger');
  const qualifyId = generateId('agent');
  const conditionId = generateId('condition');
  const emailId = generateId('agent');
  const schedulerId = generateId('agent');
  
  return {
    id: generateId('workflow'),
    name: 'Lead Generation Workflow',
    description: 'A workflow to generate and qualify leads, then schedule meetings with qualified prospects',
    nodes: [
      {
        id: triggerId,
        type: NODE_TYPES.TRIGGER,
        position: { x: 100, y: 100 },
        data: {
          label: 'New Lead Trigger',
          type: NODE_TYPES.TRIGGER,
          description: 'Triggered when a new lead is created',
          config: {
            source: 'form_submission',
          },
        },
      },
      {
        id: qualifyId,
        type: NODE_TYPES.AGENT,
        position: { x: 100, y: 225 },
        data: {
          label: 'Lead Qualifier',
          type: NODE_TYPES.AGENT,
          description: 'Qualifies leads based on data',
          config: {
            agentId: 'lead-qualifier',
          },
        },
      },
      {
        id: conditionId,
        type: NODE_TYPES.CONDITION,
        position: { x: 100, y: 350 },
        data: {
          label: 'Qualified?',
          type: NODE_TYPES.CONDITION,
          description: 'Checks if lead is qualified',
          config: {
            condition: 'score >= 70',
          },
        },
      },
      {
        id: emailId,
        type: NODE_TYPES.AGENT,
        position: { x: 300, y: 475 },
        data: {
          label: 'Email Outreach',
          type: NODE_TYPES.AGENT,
          description: 'Sends personalized emails',
          config: {
            agentId: 'email-outreach',
          },
        },
      },
      {
        id: schedulerId,
        type: NODE_TYPES.AGENT,
        position: { x: -100, y: 475 },
        data: {
          label: 'Meeting Scheduler',
          type: NODE_TYPES.AGENT,
          description: 'Schedules meetings with qualified leads',
          config: {
            agentId: 'meeting-scheduler',
          },
        },
      },
    ],
    edges: [
      {
        id: generateId('edge'),
        source: triggerId,
        target: qualifyId,
      },
      {
        id: generateId('edge'),
        source: qualifyId,
        target: conditionId,
      },
      {
        id: generateId('edge'),
        source: conditionId,
        target: schedulerId,
        label: 'Yes',
      },
      {
        id: generateId('edge'),
        source: conditionId,
        target: emailId,
        label: 'No',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates a default follow-up workflow
 */
export function createFollowUpWorkflow(): Workflow {
  const triggerId = generateId('trigger');
  const delayId = generateId('delay');
  const agentId = generateId('agent');
  const conditionId = generateId('condition');
  const emailId = generateId('agent');
  
  return {
    id: generateId('workflow'),
    name: 'Follow-up Workflow',
    description: 'A workflow to automatically follow up with leads who have not responded',
    nodes: [
      {
        id: triggerId,
        type: NODE_TYPES.TRIGGER,
        position: { x: 100, y: 100 },
        data: {
          label: 'No Response Trigger',
          type: NODE_TYPES.TRIGGER,
          description: 'Triggered when a lead does not respond in 3 days',
          config: {
            days: 3,
          },
        },
      },
      {
        id: delayId,
        type: NODE_TYPES.DELAY,
        position: { x: 100, y: 225 },
        data: {
          label: '2 Day Delay',
          type: NODE_TYPES.DELAY,
          description: 'Waits 2 days before taking action',
          config: {
            days: 2,
          },
        },
      },
      {
        id: agentId,
        type: NODE_TYPES.AGENT,
        position: { x: 100, y: 350 },
        data: {
          label: 'Follow-up Manager',
          type: NODE_TYPES.AGENT,
          description: 'Manages follow-up communications',
          config: {
            agentId: 'follow-up-manager',
          },
        },
      },
      {
        id: conditionId,
        type: NODE_TYPES.CONDITION,
        position: { x: 100, y: 475 },
        data: {
          label: 'Max Attempts?',
          type: NODE_TYPES.CONDITION,
          description: 'Checks if maximum follow-up attempts reached',
          config: {
            condition: 'attempts < 3',
          },
        },
      },
      {
        id: emailId,
        type: NODE_TYPES.AGENT,
        position: { x: 300, y: 600 },
        data: {
          label: 'Email Notification',
          type: NODE_TYPES.AGENT,
          description: 'Notifies the sales team',
          config: {
            agentId: 'email-outreach',
          },
        },
      },
    ],
    edges: [
      {
        id: generateId('edge'),
        source: triggerId,
        target: delayId,
      },
      {
        id: generateId('edge'),
        source: delayId,
        target: agentId,
      },
      {
        id: generateId('edge'),
        source: agentId,
        target: conditionId,
      },
      {
        id: generateId('edge'),
        source: conditionId,
        target: triggerId,
        label: 'Yes',
      },
      {
        id: generateId('edge'),
        source: conditionId,
        target: emailId,
        label: 'No',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const SAMPLE_WORKFLOWS: Workflow[] = [
  createLeadGenerationWorkflow(),
  createFollowUpWorkflow(),
]; 