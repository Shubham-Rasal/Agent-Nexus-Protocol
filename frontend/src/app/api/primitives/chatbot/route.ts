import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from "ai"
import { z } from "zod"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    system:
      "You are a helpful assistant with access to tools. Use the getCurrentDate tool when users ask about dates, time, or current information. You are also able to use the getTime tool to get the current time in a specific timezone. You can use the fetchUrl tool to retrieve content from web URLs, which will automatically detect content types (JSON, HTML, Markdown, text) and provide parsed data when possible.",
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
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
