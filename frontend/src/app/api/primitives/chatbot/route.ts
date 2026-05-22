import { google } from "@ai-sdk/google"
import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from "ai"
import { z } from "zod"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: `You are a helpful assistant with access to tools. When a message starts with [Agent Context], you are acting AS that agent — adopt its persona completely.

RULE 1 — Answering "what can you do":
If the user's message contains [Agent Context] and asks "what can you do", "what are your capabilities", or similar, respond by describing the agent's services from the [Agent Context] in detail. List each service, what it does, its cost, and required inputs. Do NOT say you don't have information about the agent.

RULE 2 — Calling agent services:
When [Agent Context] is present and the user asks to use/call/trigger a service, IMMEDIATELY call the requestAgentService tool. Extract ALL params from the user message and agent context. Use Endpoint, PayTo, Asset, Cost, Currency, Network exactly as listed in the context. Never ask for clarification if the required info is already in the message.

Example: agent needs { url, userId }, user says "extract brand from https://stripe.com for wallet 0xABC" → call requestAgentService with inputParams = { url: "https://stripe.com", userId: "0xABC" }.

Other tools:
- getCurrentDate: use for date/time questions
- getTime: use for timezone questions
- fetchUrl: use to retrieve web content`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(15),
    tools: {
      getTime: tool({
        description: "Get the current time in a specific timezone",
        inputSchema: z.object({
          timezone: z
            .string()
            .describe("A valid IANA timezone, e.g. 'Europe/Paris'"),
        }),
        execute: async ({ timezone }) => {
          try {
            const now = new Date()
            const time = now.toLocaleString("en-US", {
              timeZone: timezone,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })

            return { time, timezone }
          } catch {
            return { error: "Invalid timezone format." }
          }
        },
      }),
      getCurrentDate: tool({
        description: "Get the current date and time with timezone information",
        inputSchema: z.object({}),
        execute: async () => {
          const now = new Date()
          return {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            local: now.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZoneName: "short",
            }),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utc: now.toUTCString(),
          }
        },
      }),
      requestAgentService: tool({
        description: "Invoke an external agent's paid service. Use when the user wants to trigger an agent capability that costs money (x402 payment-gated). Extract the endpoint and inputParams from the agent context provided.",
        inputSchema: z.object({
          serviceName: z.string().describe("Human-readable service name"),
          endpoint: z.string().describe("Full service endpoint URL"),
          description: z.string().describe("What this service does"),
          cost: z.string().describe("Cost amount (e.g. '0.001')"),
          currency: z.string().describe("Currency symbol (e.g. 'USDC')"),
          network: z.string().describe("Network identifier (e.g. 'eip155:84532')"),
          payTo: z.string().describe("Wallet address to pay"),
          asset: z.string().describe("Token contract address"),
          inputParams: z.record(z.string(), z.unknown()).describe("Parameters to pass to the service endpoint"),
        }),
        execute: async (params) => ({ status: "payment_required", ...params }),
      }),
      fetchUrl: tool({
        description: "Fetch content from a given URL and return the response with metadata",
        inputSchema: z.object({
          url: z.string().url().describe("The URL to fetch content from"),
          includeHeaders: z.boolean().optional().describe("Whether to include response headers in the result").default(false),
        }),
        execute: async ({ url, includeHeaders = false }) => {
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-Assistant/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*',
              },
              // Add timeout
              signal: AbortSignal.timeout(10000), // 10 second timeout
            })

            if (!response.ok) {
              return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                url,
              }
            }

            const contentType = response.headers.get('content-type') || 'unknown'
            const contentLength = response.headers.get('content-length')
            const lastModified = response.headers.get('last-modified')
            
            // Try to get text content first
            let content: string
            let isText = true
            
            try {
              content = await response.text()
            } catch (error) {
              return {
                success: false,
                error: 'Failed to read response as text',
                url,
                contentType,
              }
            }

            // Check if content is too large (limit to 100KB for safety)
            if (content.length > 100000) {
              content = content.substring(0, 100000) + '\n\n... (content truncated due to size)'
            }

            const result: any = {
              success: true,
              url,
              contentType,
              contentLength: contentLength ? parseInt(contentLength) : content.length,
              content,
              isText,
            }

            if (includeHeaders) {
              result.headers = Object.fromEntries(response.headers.entries())
            }

            if (lastModified) {
              result.lastModified = lastModified
            }

            // Add content type detection
            if (isText) {
              try {
                // Try to detect if it's JSON
                if (contentType.includes('application/json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
                  try {
                    result.parsedJson = JSON.parse(content)
                    result.detectedType = 'json'
                  } catch {
                    result.detectedType = 'text'
                  }
                } else if (contentType.includes('text/html')) {
                  result.detectedType = 'html'
                } else if (contentType.includes('text/markdown') || content.includes('#') || content.includes('**') || content.includes('```')) {
                  result.detectedType = 'markdown'
                } else {
                  result.detectedType = 'text'
                }
              } catch (error) {
                result.detectedType = 'unknown'
              }
            }

            return result
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              url,
            }
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
