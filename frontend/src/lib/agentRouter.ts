/**
 * Agent Router
 * 
 * This module provides functions for routing user queries to the most appropriate agent
 * based on content analysis, agent relationships, and historical context.
 */

import { AgentId, getAgentByKeywords, findNextAgentByRelationship } from './agentRelationships';
import { Message } from '@/types/chatTypes';

export interface RoutingOptions {
  preferRelationships?: boolean;
  considerHistory?: boolean;
  historyWindowSize?: number;
}

interface RoutingDecision {
  agentId: AgentId;
  confidence: number;
  explanation: string;
}

/**
 * Route a user query to the most appropriate agent
 * 
 * @param query - The user's query text
 * @param messages - Previous messages in the conversation
 * @param options - Routing configuration options
 * @returns A routing decision with the selected agent and confidence score
 */
export function routeQuery(
  query: string,
  messages: Message[] = [],
  options: RoutingOptions = {}
): RoutingDecision {
  const {
    preferRelationships = true,
    considerHistory = true,
    historyWindowSize = 5
  } = options;
  
  // Get the most recent agent that responded, if any
  const previousAgentId = getPreviousRespondingAgent(messages, historyWindowSize);
  
  // Step 1: Try relationship-based routing if we have a previous agent
  if (preferRelationships && previousAgentId) {
    const nextAgentByRelationship = findNextAgentByRelationship(
      previousAgentId,
      query,
      preferRelationships
    );
    
    if (nextAgentByRelationship) {
      return {
        agentId: nextAgentByRelationship,
        confidence: 0.85,
        explanation: `Routing to ${nextAgentByRelationship} based on its relationship with ${previousAgentId} for this query context.`
      };
    }
  }
  
  // Step 2: Keyword-based routing
  const agentByKeywords = getAgentByKeywords(query);
  
  if (agentByKeywords !== 'general') {
    return {
      agentId: agentByKeywords,
      confidence: 0.7,
      explanation: `Routing to ${agentByKeywords} based on keyword matching in the query.`
    };
  }
  
  // Step 3: If we have a previous agent and want to consider history, we might continue with the same agent
  if (considerHistory && previousAgentId) {
    // Check if the conversation seems to be continuing on the same topic
    const isContinuation = isContinuationOfPreviousContext(query, messages, historyWindowSize);
    
    if (isContinuation) {
      return {
        agentId: previousAgentId,
        confidence: 0.6,
        explanation: `Routing to ${previousAgentId} as this appears to be a continuation of the previous conversation.`
      };
    }
  }
  
  // Step 4: Default to the general agent if no specific routing could be determined
  return {
    agentId: 'general',
    confidence: 0.5,
    explanation: 'No specific routing criteria matched. Using general-purpose agent.'
  };
}

/**
 * Get the agent ID of the most recent agent that responded in the conversation
 */
function getPreviousRespondingAgent(messages: Message[], windowSize: number): AgentId | null {
  if (!messages || messages.length === 0) return null;
  
  // Get the last few messages based on the window size
  const recentMessages = messages.slice(-windowSize);
  
  // Find the most recent message from an agent
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const message = recentMessages[i];
    if (!message.isUser && message.agentId) {
      return message.agentId as AgentId;
    }
  }
  
  return null;
}

/**
 * Determine if the current query appears to be a continuation of the previous conversation context
 */
function isContinuationOfPreviousContext(query: string, messages: Message[], windowSize: number): boolean {
  if (!messages || messages.length === 0) return false;
  
  // Get the last few messages based on the window size
  const recentMessages = messages.slice(-windowSize);
  
  // Simple heuristic: look for pronouns and references that suggest continuation
  const continuationIndicators = [
    'it', 'that', 'this', 'they', 'them', 'those',
    'continue', 'more', 'also', 'again', 'another',
    'and', 'so', 'then', 'further', 'additionally'
  ];
  
  const queryLower = query.toLowerCase();
  const hasIndicator = continuationIndicators.some(indicator => 
    queryLower.includes(` ${indicator} `) || 
    queryLower.startsWith(`${indicator} `) || 
    queryLower === indicator
  );
  
  return hasIndicator;
}

/**
 * Get a summary of all available agents and their capabilities
 */
export function getAgentCapabilitiesSummary(): Record<AgentId, string> {
  return {
    gmail: 'Handles email composition, sending, and inbox management tasks.',
    lead_qualifier: 'Analyzes and qualifies potential leads based on their interactions and provided information.',
    general: 'Handles general inquiries and requests that don\'t fit specific agent domains.',
    crm: 'Manages customer relationships, contact storage, and database operations.',
    calendar: 'Handles scheduling, appointment booking, and calendar management.',
    analytics: 'Provides data analysis, metrics reporting, and performance insights.'
  };
}

/**
 * Execute agent handoff by preparing context for the new agent
 */
export function prepareAgentHandoff(
  sourceAgentId: AgentId,
  targetAgentId: AgentId,
  messages: Message[],
  query: string
): { handoffMessage: string; relevantHistory: Message[] } {
  // Create a summary of the conversation for the new agent
  const relevantMessages = messages.slice(-10); // Get last 10 messages for context
  
  // Generate a handoff message explaining the context
  const handoffMessage = `Handoff from ${sourceAgentId} to ${targetAgentId}: I've been assisting with ${summarizeConversation(messages.slice(-5))}, and the current query is: "${query}". This seems most appropriate for your capabilities.`;
  
  return {
    handoffMessage,
    relevantHistory: relevantMessages
  };
}

/**
 * Generate a brief summary of the recent conversation
 */
function summarizeConversation(messages: Message[]): string {
  if (!messages || messages.length === 0) return "no prior context";
  
  // Count user and agent messages
  const userMessages = messages.filter(m => m.isUser).length;
  const agentMessages = messages.filter(m => !m.isUser).length;
  
  // Extract user's last query
  const lastUserMessage = messages.filter(m => m.isUser).pop()?.content || "";
  const truncatedQuery = lastUserMessage.length > 50 
    ? lastUserMessage.substring(0, 50) + "..." 
    : lastUserMessage;
  
  return `a conversation of ${userMessages} user messages and ${agentMessages} agent responses, most recently about "${truncatedQuery}"`;
} 