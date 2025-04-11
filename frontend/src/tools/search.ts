import { tool } from "llamaindex";
import { z } from "zod";

export const searchTool = tool({
  name: "search",
  description: "Search for a user id",
  parameters: z.object({
    query: z.string().describe("The query to search for"),
  }),
  execute: async ({ query }) => {
    const response = await fetch("https://anura-testnet.lilypad.tech/api/v1/websearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LILYPAD_API_TOKEN}`,
      },
      body: JSON.stringify({ query, number_of_results: 3 }),
    });

    const data = await response.json();
    return data;
  },
});

