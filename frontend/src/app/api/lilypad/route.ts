import { NextRequest, NextResponse } from 'next/server';

/**
 * Makes a real API call to the Lilypad LLM service with structured output support
 */
async function callLilypadLLM(prompt: string, schema: any, model: string = 'llama3.1:8b', temperature: number = 0.2, maxOutputTokens: number = 1000) {
  console.log("Calling Lilypad LLM with prompt:", prompt);
  
  // Lilypad API endpoint and authentication
  const API_URL = "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
  const API_TOKEN = process.env.NEXT_PUBLIC_LILYPAD_API_KEY;

  console.log("API_TOKEN:", API_TOKEN);
  if (!API_TOKEN) {
    throw new Error("LILYPAD_API_TOKEN environment variable is not set");
  }

  // Build the structure for schema-based output
  const systemMessage = `You are an AI assistant that extracts structured information from text.
You must follow these rules:
1. Always extract information according to the provided schema
2. Use exactly the structure required in the schema
3. If information is missing, use empty strings for string properties
4. Return only valid JSON

The expected schema is: ${JSON.stringify(schema, null, 2)}`;

  // Structure the messages for the LLM
  const messages = [
    {
      role: "system",
      content: systemMessage
    },
    {
      role: "user",
      content: prompt
    }
  ];

  // Create the request body for the Lilypad API
  const requestBody = {
    model: model,
    messages,
    max_tokens: maxOutputTokens,
    temperature: temperature,
    response_format: { type: "json_object" } // Using JSON mode for structured output
  };

  // Make the API call
  try {
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
        return JSON.parse(content);
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        throw new Error("Failed to parse structured output from LLM");
      }
    } else {
      throw new Error("Invalid response structure from Lilypad API");
    }
  } catch (error) {
    console.error("Error calling Lilypad API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      schema, 
      model = 'llama3.1:8b',
      temperature = 0.2,
      maxOutputTokens = 1000
    } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    if (!schema) {
      return NextResponse.json({ error: 'No schema provided for structured output' }, { status: 400 });
    }
    
    // Call the LLM with structured outputs
    const result = await callLilypadLLM(prompt, schema, model, temperature, maxOutputTokens);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in lilypad API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 