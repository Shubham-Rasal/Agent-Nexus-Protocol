/**
 * LLM Client - Utility for making LLM API requests with structured outputs
 * 
 * This client helps abstract away the complexity of making requests to LLM APIs
 * and ensures we get properly formatted structured data back.
 */

export interface LLMRequestOptions {
  prompt: string;
  schema: any;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make a request to the Lilypad LLM API with structured output support
 */
export async function makeLLMRequest<T>(options: LLMRequestOptions): Promise<LLMResponse<T>> {
  try {
    // Construct the API request
    const response = await fetch('/api/lilypad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        schema: options.schema,
        model: options.model || 'llama3.1:8b',
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxOutputTokens || 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call LLM API');
    }

    const data = await response.json();
    
    // Check for errors or empty results
    if (data.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    if (!data.result) {
      return {
        success: false,
        error: "Empty response from LLM API",
      };
    }

    // Return the structured data
    return {
      success: true,
      data: data.result as T,
    };
  } catch (error) {
    console.error('Error making LLM request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Email extraction schema - used for extracting email recipient data from text
 */
export const emailExtractionSchema = {
  type: "object",
  properties: {
    name: { 
      type: "string", 
      description: "The recipient's full name"
    },
    email: { 
      type: "string", 
      description: "The recipient's email address"
    },
    company: {
      type: "string", 
      description: "The company or organization the recipient works for, if mentioned"
    },
    position: { 
      type: "string", 
      description: "The recipient's job title or position, if mentioned"
    },
    subject: { 
      type: "string", 
      description: "The subject of the email"
    },
    body: { 
      type: "string", 
      description: "The body of the email"
    }
  },
  required: ["name", "email", "company", "position", "subject", "body"],
  additionalProperties: false
};

/**
 * Extract email recipient data from natural language text
 */
export async function extractEmailData(text: string) {
  const prompt = `
Extract the following information from the text provided below. For each field:
- Recipient's name: Extract the full name of the person to email
- Recipient's email address: Extract the complete email address
- Recipient's company: Extract the company or organization name, if mentioned
- Recipient's position: Extract the job title or position, if mentioned
- Email subject: Extract the subject of the email
- Email body: Extract the body of the email

Text: ${text}

Return this information as structured data according to the schema.
`;

  return makeLLMRequest<{
    name: string;
    email: string;
    company: string;
    position: string;
    subject: string;
    body: string;
  }>({
    prompt,
    schema: emailExtractionSchema,
  });
} 