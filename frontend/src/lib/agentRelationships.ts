/**
 * Agent Relationships Module
 * 
 * This module manages the relationships between agents and provides functions
 * for finding appropriate agents based on relationships and query context.
 */

// Agent IDs used in the system
export type AgentId = 'gmail' | 'lead_qualifier' | 'general' | 'crm' | 'calendar' | 'analytics';

// Define the structure of agent relationships
export interface AgentRelationship {
  sourceAgentId: AgentId;
  targetAgentId: AgentId;
  relationshipType: 'handoff' | 'collaboration' | 'escalation';
  relevanceScore: number; // 0-100 score indicating how relevant this relationship is
  keywords: string[]; // Trigger keywords for this relationship
  description: string; // Description of when this relationship should be used
}

// Define the agent relationship network
export const agentRelationships: AgentRelationship[] = [
  {
    sourceAgentId: 'gmail',
    targetAgentId: 'lead_qualifier',
    relationshipType: 'handoff',
    relevanceScore: 90,
    keywords: ['lead', 'prospect', 'qualify', 'sales', 'customer', 'inquiry'],
    description: 'Handoff from Gmail Agent to Lead Qualifier when dealing with potential leads or sales inquiries'
  },
  {
    sourceAgentId: 'lead_qualifier',
    targetAgentId: 'gmail',
    relationshipType: 'collaboration',
    relevanceScore: 85,
    keywords: ['email', 'send', 'reply', 'compose', 'draft'],
    description: 'Collaboration between Lead Qualifier and Gmail when email communication is needed'
  },
  {
    sourceAgentId: 'lead_qualifier',
    targetAgentId: 'crm',
    relationshipType: 'handoff',
    relevanceScore: 95,
    keywords: ['store', 'save', 'contact', 'database', 'crm', 'record'],
    description: 'Handoff from Lead Qualifier to CRM Agent when lead information needs to be stored'
  },
  {
    sourceAgentId: 'gmail',
    targetAgentId: 'calendar',
    relationshipType: 'handoff',
    relevanceScore: 80,
    keywords: ['schedule', 'meeting', 'appointment', 'calendar', 'availability'],
    description: 'Handoff from Gmail to Calendar Agent when scheduling is required'
  },
  {
    sourceAgentId: 'lead_qualifier',
    targetAgentId: 'analytics',
    relationshipType: 'collaboration',
    relevanceScore: 75,
    keywords: ['analyze', 'metrics', 'performance', 'statistics', 'data'],
    description: 'Collaboration between Lead Qualifier and Analytics for performance analysis'
  }
];

/**
 * Find the most relevant agent relationship based on the previous agent and query
 * 
 * @param previousAgentId - The ID of the agent that made the previous interaction
 * @param query - The user's query text
 * @param preferRelationships - Whether to prioritize relationship-based routing
 * @returns The most appropriate next agent ID or null if no relationship applies
 */
export function findNextAgentByRelationship(
  previousAgentId: AgentId | null,
  query: string,
  preferRelationships: boolean = false
): AgentId | null {
  if (!previousAgentId) return null;
  
  // Get all relationships where the previous agent is the source
  const possibleRelationships = agentRelationships.filter(
    rel => rel.sourceAgentId === previousAgentId
  );
  
  if (possibleRelationships.length === 0) return null;
  
  // Calculate relevance scores based on keyword matches
  const scoredRelationships = possibleRelationships.map(rel => {
    let score = rel.relevanceScore;
    
    // Increase score based on keyword matches in the query
    const queryLower = query.toLowerCase();
    const keywordMatches = rel.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    
    // Each keyword match increases the score
    score += keywordMatches.length * 5;
    
    // If preferRelationships is true, give a bonus to encourage relationship routing
    if (preferRelationships) {
      score += 20;
    }
    
    return {
      relationship: rel,
      score
    };
  });
  
  // Sort by score in descending order
  scoredRelationships.sort((a, b) => b.score - a.score);
  
  // Return the target agent of the highest scoring relationship if score is above threshold
  if (scoredRelationships.length > 0 && scoredRelationships[0].score > 60) {
    return scoredRelationships[0].relationship.targetAgentId;
  }
  
  return null;
}

/**
 * Get an agent by keyword matching
 * 
 * @param query - The user's query text
 * @returns The most appropriate agent ID based on keywords
 */
export function getAgentByKeywords(query: string): AgentId {
  const queryLower = query.toLowerCase();
  
  // Define keyword patterns for each agent
  const agentKeywords: Record<AgentId, string[]> = {
    gmail: ['email', 'gmail', 'message', 'send', 'draft', 'compose', 'reply', 'inbox'],
    lead_qualifier: ['lead', 'qualify', 'prospect', 'sales', 'customer', 'inquiry', 'potential'],
    general: [], // Default agent, no specific keywords
    crm: ['contact', 'store', 'save', 'database', 'record', 'crm'],
    calendar: ['schedule', 'meeting', 'appointment', 'calendar', 'availability', 'time'],
    analytics: ['analyze', 'metrics', 'performance', 'statistics', 'data', 'report']
  };
  
  // Calculate scores for each agent based on keyword matches
  const scores: Record<AgentId, number> = {
    gmail: 0,
    lead_qualifier: 0,
    general: 0,
    crm: 0,
    calendar: 0,
    analytics: 0
  };
  
  // Count keyword matches for each agent
  Object.entries(agentKeywords).forEach(([agent, keywords]) => {
    keywords.forEach(keyword => {
      if (queryLower.includes(keyword.toLowerCase())) {
        scores[agent as AgentId] += 1;
      }
    });
  });
  
  // Find the agent with the highest score
  let highestScore = 0;
  let bestAgent: AgentId = 'general'; // Default to general agent
  
  Object.entries(scores).forEach(([agent, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestAgent = agent as AgentId;
    }
  });
  
  return bestAgent;
} 