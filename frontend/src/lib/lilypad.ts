/**
 * LilypadInference - A class for interacting with the Lilypad API for text generation and inference
 */
export class LilypadInference {
  private apiUrl: string;
  private apiToken: string | undefined;

  constructor() {
    this.apiUrl = "https://anura-testnet.lilypad.tech/api/v1/completions";
    this.apiToken = process.env.NEXT_PUBLIC_LILYPAD_API_KEY;
    
    if (!this.apiToken) {
      console.warn("NEXT_PUBLIC_LILYPAD_API_KEY is not set. Lilypad API calls will likely fail.");
    }
  }

  /**
   * Generate text using the Lilypad API
   * @param options - Generation options
   * @returns The generated text
   */
  async generate(options: {
    model: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    if (!this.apiToken) {
      throw new Error("LILYPAD_API_TOKEN environment variable is not set");
    }

    const { model, prompt, temperature = 0.7, max_tokens = 1000, stream = false } = options;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          max_tokens: max_tokens,
          temperature: temperature,
          stream: stream,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Lilypad API request failed with status ${response.status}: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error("Invalid response structure from Lilypad API");
      }

      return data.text;
    } catch (error) {
      console.error("Error in LilypadInference.generate:", error);
      throw error;
    }
  }

  /**
   * Generate chat completions using the Lilypad API
   * @param options - Chat completion options
   * @returns The generated response
   */
  async chatCompletion(options: {
    model: string;
    messages: Array<{role: string; content: string}>;
    temperature?: number;
    max_tokens?: number;
    response_format?: {type: string};
  }): Promise<string> {
    if (!this.apiToken) {
      throw new Error("LILYPAD_API_TOKEN environment variable is not set");
    }

    const { 
      model, 
      messages, 
      temperature = 0.7, 
      max_tokens = 1000,
      response_format
    } = options;

    try {
      const chatUrl = this.apiUrl.replace("/completions", "/chat/completions");
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: max_tokens,
          temperature: temperature,
          response_format: response_format
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Lilypad API request failed with status ${response.status}: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response structure from Lilypad API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error in LilypadInference.chatCompletion:", error);
      throw error;
    }
  }
} 