export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ToolParameter {
  id: string;
  name: string;
  type: ParameterType;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  requiresAuth: boolean;
  parameters: ToolParameter[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Tools for sending and managing emails',
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Tools for storing and retrieving files and data',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Tools for managing calendar events and scheduling',
  },
  {
    id: 'analysis',
    name: 'Data Analysis',
    description: 'Tools for analyzing and processing data',
  },
]; 