import { NextResponse } from 'next/server';
import { createGmailAgent } from '@/features/agents/gmail/gmail';

// Define interfaces for response types to help TypeScript
interface ContentItem {
  type: string;
  text: string;
}

// Global variable to temporarily store auth tokens (for server-side only)
// Note: In production, this should be replaced with a more secure solution
let serverSideTokenCache: { [key: string]: { token: string, expiry: number } } = {};

export async function POST(request: Request) {
  try {
    // Get auth token from Authorization header or request body
    const authHeader = request.headers.get('Authorization');
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Parse request body
    const requestData = await request.json();
    const { message, authToken: bodyToken } = requestData;
    
    // Use token from header or body
    const token = authToken || bodyToken;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }
    
    // If token is provided, store it in the server-side cache with a short expiry (1 hour)
    if (token) {
      const sessionId = Math.random().toString(36).substring(2, 15); // Generate a simple session ID
      const expiry = Date.now() + (60 * 60 * 1000); // 1 hour expiry
      serverSideTokenCache[sessionId] = { token, expiry };
      
      // Clean up expired tokens
      Object.keys(serverSideTokenCache).forEach(key => {
        if (serverSideTokenCache[key].expiry < Date.now()) {
          delete serverSideTokenCache[key];
        }
      });
    }

    const agent = createGmailAgent(
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      token // Pass the token to the agent creation function
    );
    
    // Run the agent on the server
    const agentResponse = await agent.chat({ message });
    
    // Print debug information about the response structure
    console.log('Gmail Agent response type:', typeof agentResponse);
    console.log('Gmail Agent response keys:', Object.keys(agentResponse));
    
    // Extract tool calls for the client
    const extractedCalls: any[] = [];
    if (agentResponse.sourceNodes) {
      agentResponse.sourceNodes.forEach((node: any) => {
        if (node.metadata && node.metadata.tool_call) {
          extractedCalls.push({
            tool: node.metadata.tool_call.name,
            input: JSON.stringify(node.metadata.tool_call.parameters, null, 2),
            output: node.content
          });
        }
      });
    }

    // Extract the string response from the agent response object
    let responseText = '';
    
    // Debug the response format
    console.log('Full Gmail agent response:', JSON.stringify(agentResponse, null, 2));
    
    // Handle response based on its structure
    if (typeof agentResponse === 'object') {
      if (agentResponse.response !== undefined) {
        if (typeof agentResponse.response === 'string') {
          responseText = agentResponse.response;
        } else if (typeof agentResponse.response === 'object') {
          // For LlamaIndex >=0.10.x which returns an AIMessage object
          const responseObj = agentResponse.response as any;
          if (responseObj.content !== undefined) {
            if (typeof responseObj.content === 'string') {
              responseText = responseObj.content;
            } else if (Array.isArray(responseObj.content)) {
              // Handle content array (some versions return this)
              const contentItems = responseObj.content as ContentItem[];
              const textContent = contentItems
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
              responseText = textContent || '[No text content found in response]';
            }
          }
        }
      } else if (agentResponse.message !== undefined) {
        if (typeof agentResponse.message === 'string') {
          responseText = agentResponse.message;
        } else if (typeof agentResponse.message === 'object') {
          const messageObj = agentResponse.message as any;
          if (messageObj.content !== undefined) {
            if (typeof messageObj.content === 'string') {
              responseText = messageObj.content;
            } else if (Array.isArray(messageObj.content)) {
              // Handle content array
              const contentItems = messageObj.content as ContentItem[];
              const textContent = contentItems
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
              responseText = textContent || '[No text content found in message]';
            }
          }
        }
      } else if (agentResponse.toString && typeof agentResponse.toString === 'function') {
        // Try using toString method if it exists
        responseText = agentResponse.toString();
      }
    }
    
    // If we couldn't extract a response, use a generic message with structure info
    if (!responseText || responseText === "[object Object]") {
      responseText = "Gmail agent processed your request but the response couldn't be properly formatted. " +
        "Please check the debug information.";
    }

    // Return the response to the client
    return NextResponse.json({
      response: responseText,
      toolCalls: extractedCalls,
      isAuthenticated: !!token, // Include auth status in response
      // Include additional debugging info
      debug: {
        responseType: typeof agentResponse,
        hasResponse: agentResponse.response !== undefined,
        hasMessage: agentResponse.message !== undefined,
        keys: Object.keys(agentResponse),
        responseStructure: typeof agentResponse.response === 'object' ? 
          Object.keys(agentResponse.response) : 'not an object',
        messageStructure: typeof agentResponse.message === 'object' ? 
          Object.keys(agentResponse.message) : 'not an object'
      }
    });
  } catch (error) {
    console.error('Error processing Gmail agent request:', error);
    
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 