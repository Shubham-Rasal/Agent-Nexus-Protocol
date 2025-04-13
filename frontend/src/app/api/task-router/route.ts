import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LilypadInference } from '@/lib/lilypad';
import { findRelevantAgentByKeywords, getBestAgentForDomain, getRelatedAgents, getUserAgentPreferences } from '@/features/agents/agent-relationships';

/**
 * Task Router API
 * 
 * Routes user queries to the appropriate agent (Gmail Assistant or Lead Qualifier)
 * based on the query intent using Lilypad Inference API.
 */

// Validation schema for incoming requests
const requestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  authToken: z.string().optional(),
  previousAgentId: z.string().optional(),
  context: z.string().optional(),
  preferRelationships: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Validate request
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { query, authToken, previousAgentId, context, preferRelationships = true } = result.data;

    // First, determine the query intent
    const intent = await determineQueryIntent(query);

    // If we have a previous agent in the context, check for relationships
    if (preferRelationships && previousAgentId) {
      // Get related agents for the previous agent
      const relatedAgents = getRelatedAgents(previousAgentId);
      
      // If we have related agents, check if any of them match the current intent
      if (relatedAgents.length > 0) {
        // If Gmail intent and Gmail agent is related, use Gmail agent
        if (intent === 'gmail' && relatedAgents.includes('gmail')) {
          return routeToGmailAgent(query, authToken);
        }
        
        // If Lead Qualifier intent and Lead Qualifier agent is related, use Lead Qualifier
        if (intent === 'lead_qualifier' && relatedAgents.includes('lead_qualifier')) {
          return routeToLeadQualifierAgent(query);
        }
      }
    }
    
    // If no relationship-based routing was done, or preferences are disabled,
    // try keyword-based routing
    const keywordMatch = findRelevantAgentByKeywords(query);
    if (keywordMatch && keywordMatch.relevance > 0.3) {
      if (keywordMatch.agentId === 'gmail') {
        return routeToGmailAgent(query, authToken);
      } else if (keywordMatch.agentId === 'lead_qualifier') {
        return routeToLeadQualifierAgent(query);
      }
      // Add more agents as they become available
    }
    
    // Check user preferences
    const userPreferences = getUserAgentPreferences();
    if (userPreferences.preferredAgents.length > 0) {
      // Sort by priority (higher is better)
      const sortedPreferences = [...userPreferences.preferredAgents]
        .filter(pref => pref.isPreferred)
        .sort((a, b) => b.priority - a.priority);
      
      // Try to find a preferred agent that handles the intent
      for (const pref of sortedPreferences) {
        if (pref.agentId === 'gmail' && (intent === 'gmail' || intent === 'general')) {
          return routeToGmailAgent(query, authToken);
        } else if (pref.agentId === 'lead_qualifier' && (intent === 'lead_qualifier' || intent === 'general')) {
          return routeToLeadQualifierAgent(query);
        }
      }
    }

    // If we get here, fall back to the standard intent-based routing
    // Route to the appropriate agent based on intent
    if (intent === 'gmail') {
      return routeToGmailAgent(query, authToken);
    } else if (intent === 'lead_qualifier') {
      return routeToLeadQualifierAgent(query);
    } else {
      // Default to lead qualifier for now
      return routeToLeadQualifierAgent(query);
    }
  } catch (error) {
    console.error('Error in task router:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Determine the intent of the query to route it to the appropriate agent
 */
async function determineQueryIntent(query: string): Promise<'gmail' | 'lead_qualifier' | 'general'> {
  try {
    // Use LilypadInference to determine intent
    const lilypad = new LilypadInference();
    const prompt = `
      You are an intent classifier for a multi-agent system. Your job is to determine which agent should handle the following query.
      
      The query is: "${query}"
      
      The available agents are:
      1. Gmail Agent - handles email-related tasks like checking email, sending emails, managing inbox, etc.
      2. Lead Qualifier Agent - handles tasks related to qualifying leads, finding contact information, evaluating potential customers, etc.
      
      Based only on the query above, which agent should handle this task? Respond with ONLY one of the following:
      - "gmail" - if the query is related to email operations, inbox management, or sending/reading emails
      - "lead_qualifier" - if the query is related to lead qualification, finding contact information, or evaluating potential customers
      - "general" - if the query could be handled by either agent or you're not sure
    `;

    const response = await lilypad.generate({
      model: 'meta/llama-3-8b-instruct',
      prompt,
      temperature: 0.2,
      max_tokens: 50,
    });

    const output = response.trim().toLowerCase();
    
    if (output.includes('gmail')) {
      return 'gmail';
    } else if (output.includes('lead_qualifier') || output.includes('lead qualifier')) {
      return 'lead_qualifier';
    } else {
      return 'general';
    }
  } catch (error) {
    console.error('Error determining intent:', error);
    // Default to general intent if there's an error
    return 'general';
  }
}

/**
 * Route the query to the Gmail Agent
 */
async function routeToGmailAgent(query: string, authToken?: string) {
  try {
    // Validate auth token is present for Gmail operations
    if (!authToken) {
      return NextResponse.json(
        { error: 'Gmail authentication token is required for Gmail operations' },
        { status: 401 }
      );
    }

    // Use LilypadInference to generate a response
    const lilypad = new LilypadInference();
    const prompt = `
      You are a helpful Gmail assistant. You help users manage their emails and perform email-related tasks.
      The user has the following request:

      ${query}

      Please respond with a helpful answer addressing their Gmail-related request. Include specific instructions if the user wants to perform an action.
      Remember to be concise, to the point, and only address the Gmail-related aspects of the query.
    `;

    const response = await lilypad.generate({
      model: 'meta/llama-3-8b-instruct',
      prompt,
      temperature: 0.7,
      max_tokens: 500,
    });

    const formattedResponse = formatGmailResponse(query, response);

    return NextResponse.json({
      agentId: 'gmail',
      response: formattedResponse,
    });
  } catch (error) {
    console.error('Error routing to Gmail agent:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gmail agent' },
      { status: 500 }
    );
  }
}

/**
 * Route the query to the Lead Qualifier Agent
 */
async function routeToLeadQualifierAgent(query: string) {
  try {
    // Use LilypadInference to generate a response
    const lilypad = new LilypadInference();
    const prompt = `
      You are a Lead Qualifier agent. Your job is to help sales professionals qualify leads and find contact information for potential customers.
      The user has the following request:

      ${query}

      Please respond with a helpful answer addressing their lead qualification request. Be detailed but concise in your response.
      If you need more information to qualify the lead properly, mention this in your response.
    `;

    const response = await lilypad.generate({
      model: 'meta/llama-3-8b-instruct',
      prompt,
      temperature: 0.7,
      max_tokens: 500,
    });

    const formattedResponse = formatLeadQualifierResponse(query, response);

    return NextResponse.json({
      agentId: 'lead_qualifier',
      response: formattedResponse,
    });
  } catch (error) {
    console.error('Error routing to Lead Qualifier agent:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Lead Qualifier agent' },
      { status: 500 }
    );
  }
}

/**
 * Format Gmail agent response as Markdown
 */
function formatGmailResponse(query: string, response: string): string {
  return `## Gmail Assistant

**Query:** ${query}

### Response:
${response}

---
*Processed by Gmail Agent*
`;
}

/**
 * Format Lead Qualifier agent response as Markdown
 */
function formatLeadQualifierResponse(query: string, response: string): string {
  return `## Lead Qualification Results

**Query:** ${query}

### Results:
${response}

---
*Processed by Lead Qualifier Agent*
`;
}

