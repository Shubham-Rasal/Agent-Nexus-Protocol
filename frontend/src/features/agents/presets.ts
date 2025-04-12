import { Agent } from './schema';

export const PRESET_AGENTS: Agent[] = [
  {
    id: 'email-outreach',
    name: 'Email Outreach Agent',
    description: 'Sends personalized email sequences to leads',
    model: 'gpt-4-turbo',
    storageProvider: 'mongodb',
    tools: ['gmail-send'],
    createdAt: '2023-10-15T09:45:00Z',
    updatedAt: '2023-10-15T09:45:00Z',
    systemPrompt: 'You are an email outreach specialist. Your goal is to create personalized emails that engage potential customers, establish a connection, and generate interest in our products or services.',
  },
  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    description: 'Schedules sales calls and demos with qualified leads',
    model: 'claude-3-sonnet',
    storageProvider: 'postgresql',
    tools: ['google-calender'],
    createdAt: '2023-10-18T16:20:00Z',
    updatedAt: '2023-10-18T16:20:00Z',
    systemPrompt: 'You are a meeting scheduling assistant. Your role is to coordinate and schedule meetings between our sales team and potential clients, finding optimal times that work for all participants.',
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes lead and customer data for insights',
    model: 'claude-3-opus',
    storageProvider: 'pinecone',
    tools: ['data-aggregate', 'akave-storage', 'csv-processor'],
    createdAt: '2023-10-20T11:15:00Z',
    updatedAt: '2023-10-20T11:15:00Z',
    systemPrompt: 'You are a data analysis expert. Your purpose is to examine customer and lead data, identify patterns and trends, and generate actionable insights to improve sales and marketing strategies.',
  },
  {
    id: 'gmail-assistant',
    name: 'Gmail Assistant',
    description: 'Creates and sends emails using templates and contact search',
    model: 'gpt-4o-mini',
    storageProvider: 'local',
    tools: ['gmail-send', 'contact-search', 'email-template', 'meeting-scheduler'],
    createdAt: '2024-04-12T14:30:00Z',
    updatedAt: '2024-04-12T14:45:00Z',
    systemPrompt: 'You are a Gmail assistant. Your role is to help create and send emails, search for contacts, generate email content from templates, and schedule meetings. You should interpret natural language requests to perform these tasks efficiently.',
  }
]; 