import { tool } from "llamaindex";
import { z } from "zod";

export const searchTool = tool({
  name: "search",
  description: "Search for information on the web",
  parameters: z.object({
    query: z.string().describe("The query to search for"),
  }),
  execute: async ({ query }) => {
    const SERPER_API_KEY = process.env.SERPER_API_KEY;
    
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY environment variable is not set');
    }

    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": SERPER_API_KEY,
        },
        body: JSON.stringify({
          q: query,
          num: 3, // Number of results to return
        }),
      });

      if (!response.ok) {
        throw new Error(`Search API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match the expected format
      const results = data.organic.map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
      }));

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Error performing web search:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform web search',
      };
    }
  },
});

