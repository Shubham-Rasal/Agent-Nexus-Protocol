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
import { memo, useState } from "react"
import { useAgents } from "@/hooks/useAgents"
import { AgentMention } from "@/types/agentMentionTypes"
import { SidebarTrigger } from "@/components/SidebarTrigger"

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

export function AgentAwareChatbot() {
  const [input, setInput] = useState("")
  const [mentionedAgents, setMentionedAgents] = useState<AgentMention[]>([])
  const [messageAgentMap, setMessageAgentMap] = useState<Record<string, AgentMention[]>>({})
  const { agents, loading: agentsLoading } = useAgents()

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/primitives/chatbot",
    }),
  })

  const handleSubmit = () => {
    if (!input.trim()) return

    // Store mentioned agents for this message
    const messageId = `message-${Date.now()}`
    if (mentionedAgents.length > 0) {
      setMessageAgentMap(prev => ({
        ...prev,
        [messageId]: mentionedAgents
      }))
    }

    // Modify the input to include agent context
    let enhancedInput = input
    if (mentionedAgents.length > 0) {
      const systemPrompts = mentionedAgents
        .filter(agent => agent.systemPrompt)
        .map(agent => `${agent.name}: ${agent.systemPrompt}`)
        .join('\n\n')
      
      const agentContext = mentionedAgents
        .map(agent => `@${agent.name} (${agent.description || ''})`)
        .join(', ')
      
      enhancedInput = `[System Instructions for mentioned agents:]\n${systemPrompts}\n\n[Agents mentioned: ${agentContext}]\n\n[User Query:]\n${input}`
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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
                      <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">⌘P</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={agentsLoading}
                    >
                      <span className="mr-2">🔧</span>
                      Tools
                    </Button>
                  </div>
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