import OpenAI from 'openai';

/**
 * OpenAIClient - A class for interacting with the OpenAI API for text generation and inference
 */
export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set. OpenAI API calls will likely fail.");
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
           
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate text using the OpenAI API
   */
  async generate({
    prompt,
    model = 'gpt-3.5-turbo-16k',
    temperature = 0.2,
    maxTokens = 1000,
    functions = undefined,
    functionCall = undefined,
  }: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    functions?: any[];
    functionCall?: string;
  }) {
    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        functions,
        function_call: functionCall ? { name: functionCall } : undefined,
      });

      return {
        success: true,
        data: response.choices[0].message,
      };
    } catch (error) {
      console.error("Error in OpenAIClient.generate:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate chat completions using the OpenAI API
   */
  async chatCompletion({
    messages,
    model = 'gpt-3.5-turbo-16k',
    temperature = 0.2,
    maxTokens = 1000,
    functions = undefined,
    functionCall = undefined,
  }: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    functions?: any[];
    functionCall?: string;
  }) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        functions,
        function_call: functionCall ? { name: functionCall } : undefined,
      });

      return {
        success: true,
        data: response.choices[0].message,
      };
    } catch (error) {
      console.error("Error in OpenAIClient.chatCompletion:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
} 