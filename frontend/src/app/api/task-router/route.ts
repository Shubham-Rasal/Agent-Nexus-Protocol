import { max } from 'd3';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Task Router API
 * 
 * Routes user queries to the appropriate agent (Gmail Assistant or Lead Qualifier)
 * based on the query intent using Lilypad Inference API.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query, authToken } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check for authentication token
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    // Use Lilypad API to determine intent
    const intent = await determineQueryIntent(query);
    console.log('Intent determined:', intent);

    // Route the query to the appropriate agent based on intent
    let result;
    if (intent.agent === 'gmail') {
      result = await routeToGmailAgent(query, authToken);
    } else if (intent.agent === 'lead_qualifier') {
      result = await routeToLeadQualifierAgent(query, authToken);
    } else {
      // If intent is unclear, provide an error message
      return NextResponse.json({
        error: 'Unable to determine intent',
        intent: intent
      }, { status: 400 });
    }

    // Return the result
    return NextResponse.json({
      result: result,
      agent: intent.agent,
      confidence: intent.confidence
    });
  } catch (error) {
    console.error('Error in task router:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Determine the intent of the user query using Lilypad Inference API
 */
async function determineQueryIntent(query: string): Promise<{ agent: string; confidence: number; explanation: string }> {
  // Define the schema for the Lilypad LLM response
  const schema = {
    type: "object",
    properties: {
      agent: {
        type: "string",
        enum: ["gmail", "lead_qualifier"],
        description: "The agent that should handle this query"
      },
      confidence: {
        type: "number",
        description: "Confidence score between 0 and 1"
      },
      explanation: {
        type: "string",
        description: "Explanation of why this agent was chosen"
      }
    },
    required: ["agent", "confidence", "explanation"]
  };

  // Build system message with schema
  const systemMessage = `You are an AI assistant that determines which specialized agent should handle a user query.
You must follow these rules:
1. Analyze the query carefully to understand its intent
2. Choose between "gmail" and "lead_qualifier" agents based on the query content
3. Provide a confidence score between 0 and 1
4. Give a brief explanation for your choice
5. Return only valid JSON according to the following schema:
${JSON.stringify(schema, null, 2)}`;

  // Create a prompt that helps the LLM identify the intent
  const userMessage = `Analyze the following user query and determine which agent should handle it:
  
Query: "${query}"
  
Choose between two agents:
1. Gmail Agent: Handles email-related tasks such as drafting, sending, or searching emails. Choose this for queries about sending emails, composing messages, or email communication.
  
2. Lead Qualifier Agent: Evaluates potential leads based on criteria such as contact information (email, LinkedIn, GitHub). Choose this for queries about finding, analyzing, or qualifying leads.`;

  // Call the Lilypad Chat Completions API directly
  try {
    // Lilypad API endpoint and authentication
    const API_URL = "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
    const API_TOKEN = process.env.NEXT_PUBLIC_LILYPAD_API_KEY;

    if (!API_TOKEN) {
      throw new Error("LILYPAD_API_TOKEN environment variable is not set");
    }

    // Structure the messages for the LLM
    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    // Create the request body
    const requestBody = {
      model: "llama3.1:8b",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.2,
      response_format: { type: "json_object" } // Using JSON mode for structured output
    };

    // Make the API call
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Lilypad API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // Extract and parse the JSON response
    if (result.choices && result.choices[0] && result.choices[0].message.content) {
      const content = result.choices[0].message.content.trim();
      
      try {
        // Parse the structured JSON output
        console.log('LLM response:', content);
        return JSON.parse(content);
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        throw new Error("Failed to parse structured output from LLM");
      }
    } else {
      throw new Error("Invalid response structure from Lilypad API");
    }
  } catch (error) {
    console.error('Error determining intent:', error);
    throw new Error(`Intent classification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Route the query to the Gmail Agent
 */
async function routeToGmailAgent(query: string, authToken: string): Promise<string> {
  try {
    // Call the Gmail agent API
    const response = await fetch('http://localhost:3000/api/agents/gmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Pass the OAuth token
      },
      body: JSON.stringify({ 
        message: query,
        authToken: authToken // Also include in body for flexibility
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Gmail agent returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response as Markdown
    const rawResponse = data.response || 'Gmail agent processed your request';
    return formatGmailResponse(query, rawResponse);
  } catch (error) {
    console.error('Error calling Gmail agent:', error);
    throw error;
  }
}

/**
 * Route the query to the Lead Qualifier Agent
 */
async function routeToLeadQualifierAgent(query: string, authToken: string): Promise<string> {
  try {
    // Call the Lead Qualifier agent API
    const response = await fetch('http://localhost:3000/api/agents/leadgen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Pass the OAuth token
      },
      body: JSON.stringify({ 
        message: query,
        authToken: authToken // Also include in body for flexibility
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Lead qualifier agent returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response as Markdown
    const rawResponse = data.response || 'Lead qualifier agent processed your request';
    return formatLeadQualifierResponse(query, rawResponse);
  } catch (error) {
    console.error('Error calling Lead Qualifier agent:', error);
    throw error;
  }
}

/**
 * Format Gmail agent response as Markdown
 */
function formatGmailResponse(query: string, response: string): string {
  return `## Gmail Agent Results

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

