// Agent relationships and domain expertise mappings for the Agent Nexus Protocol
// This file defines relationships between agents and their domain expertise for routing decisions

/**
 * Type definition for agent relationship strength
 * - positive: agent has strong positive relationship with related agent (complementary skills)
 * - neutral: agents have no particular relationship
 * - negative: agents have conflicting approaches or domains
 */
export type RelationshipStrength = 'positive' | 'neutral' | 'negative';

/**
 * Agent relationship entry defining how agents relate to each other
 */
export interface AgentRelationship {
  sourceAgentId: string;
  targetAgentId: string;
  strength: RelationshipStrength;
  context?: string; // Optional context explaining the relationship
}

/**
 * Domain expertise entry for routing based on topic/domain
 */
export interface DomainExpertise {
  agentId: string;
  domain: string;
  expertiseLevel: number; // 0-1 scale
  keywords: string[]; // Keywords related to this domain
}

/**
 * Agent preference setting saved by the user
 */
export interface AgentPreference {
  agentId: string;
  isPreferred: boolean;
  priority: number; // Higher number means higher priority
}

/**
 * Predefined agent relationships in the system
 * These help determine collaboration patterns between agents
 */
export const agentRelationships: AgentRelationship[] = [
  // Gmail agent relationships
  {
    sourceAgentId: 'gmail',
    targetAgentId: 'lead_qualifier',
    strength: 'positive',
    context: 'Gmail agent can send qualified leads from lead qualifier'
  },
  {
    sourceAgentId: 'lead_qualifier',
    targetAgentId: 'gmail',
    strength: 'positive',
    context: 'Lead qualifier can use Gmail agent to reach out to qualified leads'
  },
  
  // Add more relationships as needed for other agents
  {
    sourceAgentId: 'research',
    targetAgentId: 'lead_qualifier',
    strength: 'positive',
    context: 'Research agent can provide additional information about leads'
  },
  {
    sourceAgentId: 'email_outreach',
    targetAgentId: 'gmail',
    strength: 'positive', 
    context: 'Email outreach agent uses Gmail capabilities'
  },
  {
    sourceAgentId: 'meeting_scheduler',
    targetAgentId: 'gmail',
    strength: 'positive',
    context: 'Meeting scheduler relies on Gmail for calendar invites'
  }
];

/**
 * Domain expertise definitions for agents
 * These help with routing based on the query domain
 */
export const domainExpertise: DomainExpertise[] = [
  // Gmail agent expertise
  {
    agentId: 'gmail',
    domain: 'email_communication',
    expertiseLevel: 0.9,
    keywords: ['email', 'gmail', 'message', 'inbox', 'compose', 'draft', 'send', 'reply']
  },
  {
    agentId: 'gmail',
    domain: 'calendar',
    expertiseLevel: 0.7,
    keywords: ['calendar', 'schedule', 'meeting', 'appointment', 'event']
  },
  
  // Lead qualifier expertise
  {
    agentId: 'lead_qualifier',
    domain: 'lead_evaluation',
    expertiseLevel: 0.95,
    keywords: ['lead', 'prospect', 'contact', 'qualify', 'evaluation', 'potential', 'customer']
  },
  {
    agentId: 'lead_qualifier',
    domain: 'contact_information',
    expertiseLevel: 0.85,
    keywords: ['email', 'linkedin', 'github', 'contact', 'information', 'profile']
  },
  
  // Research agent expertise
  {
    agentId: 'research',
    domain: 'web_research',
    expertiseLevel: 0.9,
    keywords: ['research', 'find', 'search', 'information', 'data']
  },
  
  // Email outreach agent expertise
  {
    agentId: 'email_outreach',
    domain: 'email_campaigns',
    expertiseLevel: 0.9,
    keywords: ['campaign', 'outreach', 'marketing', 'cold email', 'follow up']
  },
  
  // Data analyzer expertise
  {
    agentId: 'data_analyzer',
    domain: 'data_analysis',
    expertiseLevel: 0.95,
    keywords: ['analyze', 'data', 'statistics', 'metrics', 'insights', 'trends']
  }
];

/**
 * Get related agents for a given agent ID
 * Returns agents with positive relationships to the specified agent
 */
export function getRelatedAgents(agentId: string): string[] {
  return agentRelationships
    .filter(rel => rel.sourceAgentId === agentId && rel.strength === 'positive')
    .map(rel => rel.targetAgentId);
}

/**
 * Find the best agent for a given domain
 * Returns the agent with the highest expertise level in the specified domain
 */
export function getBestAgentForDomain(domain: string): string | null {
  const relevantExpertise = domainExpertise.filter(exp => exp.domain === domain);
  if (relevantExpertise.length === 0) return null;
  
  // Sort by expertise level and return the top agent
  relevantExpertise.sort((a, b) => b.expertiseLevel - a.expertiseLevel);
  return relevantExpertise[0].agentId;
}

/**
 * Find the most relevant agent based on keywords in the query
 * Uses a simple keyword matching approach with domain expertise
 */
export function findRelevantAgentByKeywords(query: string): { agentId: string; relevance: number } | null {
  // Normalize the query
  const normalizedQuery = query.toLowerCase();
  
  // Calculate relevance scores for each agent
  const scores: { agentId: string; relevance: number }[] = [];
  
  // Track agents that have already been scored to avoid duplicates
  const scoredAgents = new Set<string>();
  
  // Check each domain expertise entry for keyword matches
  domainExpertise.forEach(expertise => {
    // Skip if we've already scored this agent
    if (scoredAgents.has(expertise.agentId)) return;
    
    let keywordMatches = 0;
    let totalKeywords = expertise.keywords.length;
    
    // Count how many keywords from this domain match in the query
    expertise.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
    
    // Calculate a relevance score if we have matches
    if (keywordMatches > 0) {
      const matchRatio = keywordMatches / totalKeywords;
      const relevance = matchRatio * expertise.expertiseLevel;
      
      scores.push({
        agentId: expertise.agentId,
        relevance
      });
      
      scoredAgents.add(expertise.agentId);
    }
  });
  
  // If no matches, return null
  if (scores.length === 0) return null;
  
  // Return the agent with the highest relevance score
  scores.sort((a, b) => b.relevance - a.relevance);
  return scores[0];
}

/**
 * Check if there's a relationship between two agents
 */
export function getRelationship(sourceAgentId: string, targetAgentId: string): AgentRelationship | null {
  const relationship = agentRelationships.find(
    rel => rel.sourceAgentId === sourceAgentId && rel.targetAgentId === targetAgentId
  );
  
  return relationship || null;
}

/**
 * User's agent preferences (to be stored in localStorage)
 */
export interface UserAgentPreferences {
  preferredAgents: AgentPreference[];
  lastUpdated: number;
}

/**
 * Get stored user preferences for agents
 */
export function getUserAgentPreferences(): UserAgentPreferences {
  if (typeof localStorage === 'undefined') {
    return { preferredAgents: [], lastUpdated: Date.now() };
  }
  
  const stored = localStorage.getItem('anp_agent_preferences');
  if (!stored) {
    return { preferredAgents: [], lastUpdated: Date.now() };
  }
  
  try {
    return JSON.parse(stored) as UserAgentPreferences;
  } catch (error) {
    console.error('Error parsing agent preferences:', error);
    return { preferredAgents: [], lastUpdated: Date.now() };
  }
}

/**
 * Save user preferences for agents
 */
export function saveUserAgentPreferences(preferences: UserAgentPreferences): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem('anp_agent_preferences', JSON.stringify({
      ...preferences,
      lastUpdated: Date.now()
    }));
  } catch (error) {
    console.error('Error saving agent preferences:', error);
  }
} 