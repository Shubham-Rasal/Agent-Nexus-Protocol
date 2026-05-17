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
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import AgentMentionInput from "@/components/AgentMentionInput"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
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
import { useReputationFeedback } from "@/hooks/useReputationFeedback"
import { useChatHistory } from "@/hooks/useChatHistory"
import { AgentMention } from "@/types/agentMentionTypes"
import { SidebarTrigger } from "@/components/SidebarTrigger"
import { PaymentApprovalCard } from "@/components/primitives/PaymentApprovalCard"

type MessageComponentProps = {
  message: UIMessage
  isLastMessage: boolean
  mentionedAgents?: AgentMention[]
  onFeedback?: (agentId: string, rating: 1 | 5) => void
}

export const MessageComponent = memo(
  ({ message, isLastMessage, mentionedAgents, onFeedback }: MessageComponentProps) => {
    const isAssistant = message.role === "assistant"

    return (
      <Message
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 sm:px-2 md:px-10",
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

            {/* Render tool invocations (payment cards, etc.) */}
            {message.parts.map((part: any, i: number) => {
              // AI SDK v4: static tool parts have type "tool-{toolName}"
              // dynamic tool parts have type "dynamic-tool" with a toolName field
              const isRequestAgentService =
                part.type === "tool-requestAgentService" ||
                (part.type === "dynamic-tool" && part.toolName === "requestAgentService");
              if (!isRequestAgentService) return null;
              // v4 uses state="output-available" and part.output; fall back to part.result for compat
              const output = part.output ?? part.result;
              if (output?.status === "payment_required") {
                return <PaymentApprovalCard key={i} request={output} />;
              }
              return null;
            })}

            <MessageContent
              className="text-foreground prose max-w-[85%] sm:max-w-[75%] rounded-lg bg-transparent p-0"
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
                  <button
                    onClick={() => {
                      const agentId = mentionedAgents?.[0]?.id;
                      if (agentId) onFeedback?.(agentId, 5);
                    }}
                  >
                    <ThumbsUp className="size-4" />
                  </button>
                </MessageAction>
                <MessageAction tooltip="Dislike">
                  <button
                    onClick={() => {
                      const agentId = mentionedAgents?.[0]?.id;
                      if (agentId) onFeedback?.(agentId, 1);
                    }}
                  >
                    <ThumbsDown className="size-4" />
                  </button>
                </MessageAction>
              </MessageActions>
            )}
          </div>
        ) : (
          <div className="flex w-full max-w-lg flex-col gap-2 items-end">
            <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
              {(() => {
                const raw = message.parts.map((part) => (part.type === "text" ? part.text : null)).join("")
                const m = raw.match(/\[User Message\]\n([\s\S]+)/)
                return m ? m[1].trim() : raw
              })()}
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

const ErrorMessage = memo(({ error }: { error: Error }) => (
  <Message className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
    <div className="group flex w-full flex-col items-start gap-0">
      <div className="text-destructive-foreground flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-destructive/20 bg-destructive/10 px-2 py-1">
        <AlertTriangle size={16} className="text-destructive" />
        <p className="text-destructive">{error.message}</p>
      </div>
    </div>
  </Message>
))

ErrorMessage.displayName = "ErrorMessage"

// Module-level cache so closures always see the latest enriched agents
const enrichedAgentCache = new Map<string, AgentMention>()

export function AgentAwareChatbot({ conversationId }: { conversationId?: string }) {
  const [input, setInput] = useState("")
  const [mentionedAgents, setMentionedAgents] = useState<AgentMention[]>([])
  const [messageAgentMap, setMessageAgentMap] = useState<Record<string, AgentMention[]>>({})
  const [inputFocused, setInputFocused] = useState(false)
  // Only fetch agents once the user focuses the input — avoids blocking thread load
  const { agents, loading: agentsLoading } = useAgents(inputFocused)
  const { submitFeedback } = useReputationFeedback()
  const { save, get } = useChatHistory()

  // Load initial messages from history when conversationId is provided
  const initialMessages = conversationId ? (get(conversationId)?.messages ?? []) : []

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/primitives/chatbot",
    }),
  })

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      save(conversationId, messages)
    }
  }, [messages, conversationId, save])

  // Fetch full agent card details; returns cached result or fetches fresh
  const fetchAgentDetail = async (agent: AgentMention): Promise<AgentMention> => {
    const cacheKey = String(agent.id)
    if (enrichedAgentCache.has(cacheKey)) return enrichedAgentCache.get(cacheKey)!
    try {
      const uri = encodeURIComponent(agent.agentURI ?? "")
      const res = await fetch(`/api/agents/${agent.id}?agentURI=${uri}`)
      if (!res.ok) return agent
      const detail = await res.json()
      const enriched = { ...agent, ...detail }
      enrichedAgentCache.set(cacheKey, enriched)
      return enriched
    } catch {
      return agent
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || !conversationId) return

    // Fetch details for all mentioned agents (parallel, awaited before sending)
    const resolvedAgents = await Promise.all(mentionedAgents.map(fetchAgentDetail))

    // Store mentioned agents for this message
    const messageId = `message-${Date.now()}`
    if (resolvedAgents.length > 0) {
      setMessageAgentMap(prev => ({ ...prev, [messageId]: resolvedAgents }))
    }

    // Build enriched prompt with full agent context
    let enhancedInput = input
    if (resolvedAgents.length > 0) {
      const agentBlocks = resolvedAgents.map((agent: any) => {
        const lines: string[] = [`### ${agent.name}`]
        if (agent.description) lines.push(`Description: ${agent.description}`)
        if (agent.systemPrompt) lines.push(`\nSystem prompt:\n${agent.systemPrompt}`)

        // Include services — this is where most agent capability info lives
        const services: any[] = agent.services ?? []
        const actionableServices = services.filter((s: any) => s.endpoint && s.name !== "agentWallet")
        if (actionableServices.length > 0) {
          lines.push(`\nServices this agent exposes:`)
          actionableServices.forEach((s: any) => {
            lines.push(`- **${s.name}**: ${s.description ?? ""}`)
            lines.push(`  Endpoint: ${s.endpoint}`)
            const cost = s.cost ?? s.payment?.amount
            const currency = s.currency ?? s.payment?.currency
            const network = s.network ?? s.payment?.network
            const payTo = s.payTo ?? s.payment?.payTo ?? ""
            const asset = s.asset ?? s.payment?.asset ?? ""
            if (cost) lines.push(`  Cost: ${cost} ${currency ?? ""} on ${network ?? ""}`)
            if (payTo) lines.push(`  PayTo: ${payTo}`)
            if (asset) lines.push(`  Asset: ${asset}`)
            if (s.inputSchema?.properties) {
              const props = Object.entries(s.inputSchema.properties as Record<string, any>)
                .map(([k, v]) => `${k} (${(v as any).type}): ${(v as any).description ?? ""}`)
                .join(", ")
              lines.push(`  Input: ${props}`)
            }
            if (s.responseSchema) {
              lines.push(`  Returns: ${JSON.stringify(s.responseSchema)}`)
            }
          })
        }

        if (agent.tools?.length) lines.push(`\nTools: ${agent.tools.join(", ")}`)
        if (agent.knowledge_sources?.length) lines.push(`Knowledge sources: ${agent.knowledge_sources.join(", ")}`)
        return lines.join("\n")
      }).join("\n\n---\n\n")

      enhancedInput = [
        `[Agent Context]\nThe user has mentioned the following agents. Adopt their persona and capabilities to answer. If the user asks what you can do, explain your services in detail.\n\n${agentBlocks}`,
        `[User Message]\n${input}`,
      ].join('\n\n')
    }

    sendMessage({ text: enhancedInput })
    setInput("")
    setMentionedAgents([])
  }

  const handleMentionChange = (mentions: AgentMention[]) => {
    setMentionedAgents(mentions)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {!hasMessages ? (
        // Welcome screen
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
                    onFocus={() => setInputFocused(true)}
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

                <div className="flex items-center justify-end p-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {agentsLoading ? "Loading..." : `${agents.length} agents`}
                    </span>
                    <Button
                      size="icon"
                      disabled={!input.trim() || status !== "ready"}
                      onClick={handleSubmit}
                      className="size-9 rounded-full"
                    >
                      {status === "ready" ? (
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
        // Chat mode
        <>
          {/* Chat Header */}
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
                    onFeedback={submitFeedback}
                  />
                )
              })}

              {status === "submitted" && <LoadingMessage />}
              {status === "error" && error && <ErrorMessage error={error} />}
            </ChatContainerContent>
          </ChatContainerRoot>
          
          <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
            <PromptInput
              isLoading={status !== "ready"}
              className="border-input bg-card relative z-10 w-full rounded-2xl border shadow-sm"
            >
              <div className="flex flex-col">
                <div className="px-4 py-3">
                  <AgentMentionInput
                    input={input}
                    onChange={setInput}
                    onChangeMention={handleMentionChange}
                    onEnter={handleSubmit}
                    onFocus={() => setInputFocused(true)}
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

                <div className="flex items-center justify-end p-4 pt-2">
                  <Button
                    size="icon"
                    disabled={
                      !input.trim() || (status !== "ready" && status !== "error")
                    }
                    onClick={handleSubmit}
                    className="size-9 rounded-full"
                  >
                    {status === "ready" || status === "error" ? (
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