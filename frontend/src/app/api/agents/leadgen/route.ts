import { OpenAIAgent } from 'llamaindex';
import { OpenAI } from 'llamaindex';
import { NextResponse } from 'next/server';
import { leadQualification, akaveStorage, lilyPadsWebSearch } from '@/features/agents/leadgen/leadgen';

// Define interfaces for response types to help TypeScript
interface ContentItem {
  type: string;
  text?: string; // Make text optional since it might not always be present
}

interface AIMessageContent {
  content: string | ContentItem[];
}

// Extended response type to allow for additional properties that might exist
interface ExtendedResponse {
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const agent = new OpenAIAgent({
      llm: new OpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        maxTokens: 5000,
        maxRetries: 1,
        supportToolCall: true,
      }),
      tools: [lilyPadsWebSearch, akaveStorage, leadQualification],
    });
    
    // Run the agent on the server
    const agentResponse = await agent.chat({ message });
    
    // Print debug information about the response structure
    console.log('Agent response type:', typeof agentResponse);
    console.log('Agent response keys:', Object.keys(agentResponse));
    
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
    console.log('Full agent response:', JSON.stringify(agentResponse, null, 2));
    
    // Treat agent response as an extended type to allow additional properties
    const extendedResponse = agentResponse as unknown as ExtendedResponse;
    
    // Handle response based on its structure
    if (typeof extendedResponse === 'object') {
      // Handle different response structures
      
      // Case 1: Direct response property as string
      if (typeof extendedResponse.response === 'string') {
        responseText = extendedResponse.response;
      } 
      // Case 2: Response as an AIMessage object
      else if (extendedResponse.response && typeof extendedResponse.response === 'object') {
        const responseObj = extendedResponse.response as any;
        
        // Handle string content
        if (typeof responseObj.content === 'string') {
          responseText = responseObj.content;
        } 
        // Handle array of content items
        else if (Array.isArray(responseObj.content)) {
          responseText = responseObj.content
            .filter((item: any) => item.type === 'text' && typeof item.text === 'string')
            .map((item: any) => item.text)
            .join('\n');
            
          if (!responseText) {
            responseText = '[No text content found in response]';
          }
        }
        // Handle text property directly on response object
        else if (typeof responseObj.text === 'string') {
          responseText = responseObj.text;
        }
      }
      
      // Case 3: Message property as string
      else if (typeof extendedResponse.message === 'string') {
        responseText = extendedResponse.message;
      } 
      // Case 4: Message as an AIMessage object
      else if (extendedResponse.message && typeof extendedResponse.message === 'object') {
        const messageObj = extendedResponse.message as any;
        
        // Handle string content
        if (typeof messageObj.content === 'string') {
          responseText = messageObj.content;
        } 
        // Handle array of content items
        else if (Array.isArray(messageObj.content)) {
          responseText = messageObj.content
            .filter((item: any) => item.type === 'text' && typeof item.text === 'string')
            .map((item: any) => item.text)
            .join('\n');
            
          if (!responseText) {
            responseText = '[No text content found in message]';
          }
        }
        // Handle text property directly on message object
        else if (typeof messageObj.text === 'string') {
          responseText = messageObj.text;
        }
      }
      
      // Case 5: Raw text property if it exists on the extended response
      else if ('text' in extendedResponse && typeof extendedResponse.text === 'string') {
        responseText = extendedResponse.text;
      }
      
      // Case 6: Try toString method
      else if (extendedResponse.toString && typeof extendedResponse.toString === 'function') {
        const stringified = extendedResponse.toString();
        if (stringified !== '[object Object]') {
          responseText = stringified;
        }
      }
    }
    
    // If we couldn't extract a response, use a generic message with structure info
    if (!responseText || responseText === "[object Object]") {
      responseText = "Agent processed your request but the response couldn't be properly formatted. " +
        "Please check the debug information.";
    }

    // Return the response to the client
    return NextResponse.json({
      response: responseText,
      toolCalls: extractedCalls,
      // Include additional debugging info
      debug: {
        responseType: typeof agentResponse,
        hasResponse: 'response' in extendedResponse,
        hasMessage: 'message' in extendedResponse,
        responseKeys: extendedResponse ? Object.keys(extendedResponse) : [],
        responseStructure: typeof extendedResponse.response === 'object' && extendedResponse.response ? 
          Object.keys(extendedResponse.response) : 'not an object',
        messageStructure: typeof extendedResponse.message === 'object' && extendedResponse.message ? 
          Object.keys(extendedResponse.message) : 'not an object'
      }
    });
  } catch (error) {
    console.error('Error processing agent request:', error);
    
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