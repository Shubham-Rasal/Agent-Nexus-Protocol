import { NextRequest, NextResponse } from 'next/server';
import { OpenAIClient } from '@/lib/openai';

/**
 * Makes a real API call to the OpenAI service with structured output support
 */
async function callOpenAILLM(prompt: string, schema: any, model: string = 'gpt-3.5-turbo-16k', temperature: number = 0.2, maxOutputTokens: number = 1000) {
  console.log("Calling OpenAI with prompt:", prompt);
  
  // Build the structure for schema-based output
  const systemMessage = `You are an AI assistant that extracts structured information from text.
You must follow these rules:
1. Always extract information according to the provided schema
2. Use exactly the structure required in the schema
3. If information is missing, use empty strings for string properties
4. Return only valid JSON

The expected schema is: ${JSON.stringify(schema, null, 2)}`;

  // Initialize OpenAI client
  const openai = new OpenAIClient();

  try {
    const response = await openai.chatCompletion({
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: model,
      temperature: temperature,
      maxTokens: maxOutputTokens,
      functions: [
        {
          name: "extract_information",
          description: "Extract structured information from text according to the schema",
          parameters: schema
        }
      ],
      functionCall: "extract_information"
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to get response from OpenAI');
    }

    // Extract and parse the JSON response
    const functionCall = response.data.function_call;
    if (functionCall && functionCall.name === "extract_information") {
      try {
        // Parse the structured JSON output
        return JSON.parse(functionCall.arguments);
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        throw new Error("Failed to parse structured output from OpenAI");
      }
    } else {
      throw new Error("Invalid response structure from OpenAI API");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      schema, 
      model = 'gpt-3.5-turbo-16k',
      temperature = 0.2,
      maxOutputTokens = 1000
    } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    if (!schema) {
      return NextResponse.json({ error: 'No schema provided for structured output' }, { status: 400 });
    }
    
    // Call OpenAI with structured outputs
    const result = await callOpenAILLM(prompt, schema, model, temperature, maxOutputTokens);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 