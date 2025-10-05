"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { DotsLoader } from "@/components/prompt-kit/loader"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message"
import {
  PromptInput,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import AgentMentionInput from "@/components/AgentMentionInput"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import {
  AlertTriangle,
  ArrowUp,
  Copy,
  ThumbsDown,
  ThumbsUp,
  Bot,
} from "lucide-react"
import { memo, useState, useEffect } from "react"
import { useAgents } from "@/hooks/useAgents"
import { AgentMention } from "@/types/agentMentionTypes"
import { SidebarTrigger } from "@/components/SidebarTrigger"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"
import { MCPApiService } from '@/services/mcpApiService'

// Initialize Google AI
const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || '',
})

// IndexedDB Service (simplified version for reading)
class IndexedDBService {
  private dbName = 'AIAgentsDB'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
    })
  }

  async getAgent(agentId: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized')
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents'], 'readonly')
      const store = transaction.objectStore('agents')
      const request = store.get(agentId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}

// MCP Tool utilities
const convertMCPSchemaToZod = (schema: any): z.ZodType<any> => {
  if (!schema || !schema.properties) return z.object({})
  
  const zodObject: Record<string, z.ZodType<any>> = {}
  
  Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
    switch (prop.type) {
      case 'string':
        zodObject[key] = z.string().describe(prop.description || '')
        break
      case 'number':
        zodObject[key] = z.number().describe(prop.description || '')
        break
      case 'boolean':
        zodObject[key] = z.boolean().describe(prop.description || '')
        break
      case 'array':
        zodObject[key] = z.array(z.any()).describe(prop.description || '')
        break
      case 'object':
        zodObject[key] = z.object({}).describe(prop.description || '')
        break
      default:
        zodObject[key] = z.any().describe(prop.description || '')
    }
    
    if (!schema.required?.includes(key)) {
      zodObject[key] = zodObject[key].optional()
    }
  })
  
  return z.object(zodObject)
}

const createToolsFromMCPServers = async (serverIds: string[], mcpServers: any[]) => {
  const tools: Record<string, any> = {}
  
  for (const serverId of serverIds) {
    const server = mcpServers.find(s => s.id === serverId)
    if (!server || server.status !== 'connected') continue
    
    server.tools.forEach((mcpTool: any) => {
      const toolKey = `${server.name}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, '_')
      
      tools[toolKey] = tool({
        description: mcpTool.description || `Tool from ${server.name}: ${mcpTool.name}`,
        inputSchema: mcpTool.inputSchema
          ? convertMCPSchemaToZod(mcpTool.inputSchema)
          : z.object({}),
        execute: async (args: any) => {
          try {
            const result = await MCPApiService.callTool({
              serverId: serverId,
              toolName: mcpTool.name,
              arguments: args || {}
            })
            return result.result || { success: false, error: result.error }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Tool execution failed'
            }
          }
        }
      })
    })
  }
  
  return tools
}

type MessageComponentProps = {
  message: UIMessage
  isLastMessage: boolean
  mentionedAgents?: AgentMention[]
}

export const MessageComponent = memo(
  ({ message, isLastMessage, mentionedAgents }: MessageComponentProps) => {
    const isAssistant = message.role === "assistant"

    return (
      <Message
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2 px-2 md:px-10",
          isAssistant ? "items-start" : "items-end"
        )}
      >
        {isAssistant ? (
          <div className="group flex w-full flex-col gap-0">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Assistant</span>
              {mentionedAgents && mentionedAgents.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {mentionedAgents.map((agent) => (
                    <span
                      key={agent.id}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      title={agent.description}
                    >
                      @{agent.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <MessageContent
              className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0"
              markdown
            >
              {message.parts
                .map((part) => (part.type === "text" ? part.text : null))
                .join("")}
            </MessageContent>
            {isLastMessage && (
              <MessageActions className="mt-2 gap-2 opacity-100 transition-opacity duration-200 group-hover:opacity-100 md:opacity-0">
                <MessageAction tooltip="Copy">
                  <Copy className="size-4" />
                </MessageAction>
                <MessageAction tooltip="Like">
                  <ThumbsUp className="size-4" />
                </MessageAction>
                <MessageAction tooltip="Dislike">
                  <ThumbsDown className="size-4" />
                </MessageAction>
              </MessageActions>
            )}
          </div>
        ) : (
          <div className="flex w-full max-w-lg flex-col gap-2">
            <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
              {message.parts
                .map((part) => (part.type === "text" ? part.text : null))
                .join("")}
            </MessageContent>
            {mentionedAgents && mentionedAgents.length > 0 && (
              <div className="flex gap-1 justify-end">
                {mentionedAgents.map((agent) => (
                  <span
                    key={agent.id}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                    title={agent.description}
                  >
                    @{agent.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Message>
    )
  }
)

MessageComponent.displayName = "MessageComponent"

const LoadingMessage = memo(() => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col gap-0">
      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
        <DotsLoader />
      </div>
    </div>
  </Message>
))

LoadingMessage.displayName = "LoadingMessage"

const ErrorMessage = memo(({ error }: { error: string }) => (
  <Message className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col items-start gap-0">
      <div className="text-destructive-foreground flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-destructive/20 bg-destructive/10 px-2 py-1">
        <AlertTriangle size={16} className="text-destructive" />
        <p className="text-destructive">{error}</p>
      </div>
    </div>
  </Message>
))

ErrorMessage.displayName = "ErrorMessage"

export function AgentAwareChatbot() {
  const [input, setInput] = useState("")
  const [mentionedAgents, setMentionedAgents] = useState<AgentMention[]>([])
  const [messageAgentMap, setMessageAgentMap] = useState<Record<string, AgentMention[]>>({})
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mcpServers, setMcpServers] = useState<any[]>([])
  const [dbService] = useState(() => new IndexedDBService())
  const [dbInitialized, setDbInitialized] = useState(false)
  
  const { agents, loading: agentsLoading } = useAgents()

  useEffect(() => {
    const init = async () => {
      try {
        await dbService.init()
        setDbInitialized(true)
        const servers = await MCPApiService.loadServers()
        setMcpServers(servers)
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!input.trim() || !dbInitialized || isLoading) return

    setIsLoading(true)
    setError(null)

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text: input }]
    }

    const messageId = userMessage.id
    if (mentionedAgents.length > 0) {
      setMessageAgentMap(prev => ({
        ...prev,
        [messageId]: mentionedAgents
      }))
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    const currentMentions = [...mentionedAgents]
    setInput("")
    setMentionedAgents([])

    try {
      // If agents are mentioned, use their configuration
      if (currentMentions.length > 0) {
        // Get full agent data from IndexedDB
        const fullAgents = await Promise.all(
          currentMentions.map(mention => dbService.getAgent(mention.id))
        )

        // Use the first mentioned agent's configuration
        const primaryAgent = fullAgents[0]
        
        if (!primaryAgent) {
          throw new Error('Agent not found in database')
        }

        // Only support Google for now
        if (primaryAgent.llmProvider !== 'google') {
          throw new Error(`LLM provider "${primaryAgent.llmProvider}" is not yet supported. Only Google Gemini is currently available.`)
        }

        // Create tools from agent's MCP servers
        const tools = await createToolsFromMCPServers(
          primaryAgent.mcpServers || [],
          mcpServers
        )

        // Enhance system prompt to ensure response after tool use
        const enhancedSystemPrompt = `${primaryAgent.systemPrompt}

IMPORTANT: After using any tools, you MUST provide a clear, natural language response that:
1. Explains what you did
2. Presents the results in a user-friendly way
3. Answers the user's original question

Never just execute a tool silently - always follow up with an explanation.`

        // Generate response using agent's configuration
        const result = await generateText({
          model: google("models/gemini-2.5-flash"),
          system: enhancedSystemPrompt,
          prompt: currentInput,
          tools: Object.keys(tools).length > 0 ? tools : undefined,
        })

        console.log('Generation result:', result)

        // Extract response text - simplified approach
        let responseText = result.text

        // If no text but we have tool results, extract directly from tool output
        if (!responseText && result.toolResults && result.toolResults.length > 0) {
          console.log('Extracting from tool results...')
          console.log('Tool results structure:', JSON.stringify(result.toolResults, null, 2))
          
          const lastToolResult = result.toolResults[result.toolResults.length - 1]
          
          // The toolResult has 'output' not 'result' property
          const output = (lastToolResult as any).output || lastToolResult
          
          // Try to extract the actual content text from MCP format
          if (output?.content?.[0]?.text) {
            responseText = output.content[0].text
          } else if (typeof output === 'string') {
            responseText = output
          } else if (output) {
            responseText = JSON.stringify(output, null, 2)
          }
        }

        // Final fallback
        if (!responseText) {
          responseText = "No response generated."
        }

        const assistantMessage: UIMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text: responseText }]
        }

        setMessageAgentMap(prev => ({
          ...prev,
          [assistantMessage.id]: currentMentions
        }))

        setMessages(prev => [...prev, assistantMessage])
      } else {
        // No agents mentioned - use default behavior
        const result = await generateText({
          model: google("models/gemini-2.5-flash"),
          prompt: currentInput,
        })

        const assistantMessage: UIMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text: result.text }]
        }

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error('Error generating response:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMentionChange = (mentions: AgentMention[]) => {
    setMentionedAgents(mentions)
  }

  const hasMessages = messages.length > 0

  if (!dbInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-4xl font-semibold text-foreground mb-4">
              Where would you like to start?
            </h1>
          </div>
          
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl shadow-sm">
                <div className="p-4">
                  <AgentMentionInput
                    input={input}
                    onChange={setInput}
                    onChangeMention={handleMentionChange}
                    onEnter={handleSubmit}
                    placeholder="What do you want to know?"
                    agents={agents}
                    className="min-h-[60px] text-lg leading-relaxed border-none outline-none focus:ring-0 resize-none"
                  />
                </div>

                {mentionedAgents.length > 0 && (
                  <div className="px-4 pb-2 flex gap-1 flex-wrap">
                    {mentionedAgents.map((agent) => (
                      <span
                        key={agent.id}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1"
                      >
                        <Bot className="h-3 w-3" />
                        {agent.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between p-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={agentsLoading}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      Auto
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {agentsLoading ? "Loading..." : `${agents.length} agents`}
                    </span>
                    <Button
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      onClick={handleSubmit}
                      className="size-9 rounded-full"
                    >
                      {!isLoading ? (
                        <ArrowUp size={18} />
                      ) : (
                        <span className="size-3 rounded-xs bg-current opacity-50" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">Agent Chat</h1>
            </div>
          </div>
          
          <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto">
            <ChatContainerContent className="space-y-12 px-4 py-12">
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1
                const messageMentions = messageAgentMap[message.id] || []

                return (
                  <MessageComponent
                    key={message.id}
                    message={message}
                    isLastMessage={isLastMessage}
                    mentionedAgents={messageMentions}
                  />
                )
              })}

              {isLoading && <LoadingMessage />}
              {error && <ErrorMessage error={error} />}
            </ChatContainerContent>
          </ChatContainerRoot>
          
          <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
            <PromptInput
              isLoading={isLoading}
              className="border-input bg-card relative z-10 w-full rounded-2xl border shadow-sm"
            >
              <div className="flex flex-col">
                <div className="px-4 py-3">
                  <AgentMentionInput
                    input={input}
                    onChange={setInput}
                    onChangeMention={handleMentionChange}
                    onEnter={handleSubmit}
                    placeholder="Type @ to mention an agent..."
                    agents={agents}
                    className="min-h-[44px] text-base leading-[1.3] border-none outline-none focus:ring-0"
                  />
                </div>

                {mentionedAgents.length > 0 && (
                  <div className="px-4 pb-2 flex gap-1 flex-wrap">
                    {mentionedAgents.map((agent) => (
                      <span
                        key={agent.id}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1"
                      >
                        <Bot className="h-3 w-3" />
                        {agent.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between p-4 pt-2">
                  <div className="text-xs text-muted-foreground">
                    {agentsLoading ? "Loading agents..." : `${agents.length} agents available`}
                  </div>
                  <Button
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    onClick={handleSubmit}
                    className="size-9 rounded-full"
                  >
                    {!isLoading ? (
                      <ArrowUp size={18} />
                    ) : (
                      <span className="size-3 rounded-xs bg-white" />
                    )}
                  </Button>
                </div>
              </div>
            </PromptInput>
          </div>
        </>
      )}
    </div>
  )
}

export default AgentAwareChatbot