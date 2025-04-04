"use client";

import { useState, useRef, useEffect } from 'react';
import { agents } from '@/app/agents.json';
import AgentResponse from '@/components/AgentResponse';
import { EnhancedWorkflowPanel } from '@/components/EnhancedWorkflowPanel';
import { WorkflowSelector } from '@/components/WorkflowSelector';
import { SendHorizontal, Sparkles, GitBranch, AlertCircle, Info, ChevronDown, Settings, HelpCircle, Clock, Zap, History, PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Workflow } from '@/features/workflows/registry/types';
import { workflowRegistry } from '@/features/workflows/registry/registry';
import { taskRouter } from '@/features/workflows/router/router';
import { workflowEngine } from '@/features/workflows/engine/engine';
import { SubTask } from '@/features/workflows/router/types';

// Helper function to generate mock responses for the general purpose agent
function mockGenerateResponse(query: string): string {
  // In a real implementation, this would call an LLM API
  
  // Simple response patterns based on query content
  if (query.toLowerCase().includes('hello') || query.toLowerCase().includes('hi')) {
    return "Hello! I'm your general assistant. How can I help you today?";
  }
  
  if (query.toLowerCase().includes('weather')) {
    return "I don't have real-time weather data access in this demo, but in a real implementation, I could provide current weather and forecasts for any location.";
  }
  
  if (query.toLowerCase().includes('help') || query.toLowerCase().includes('can you')) {
    return "I'm a general purpose assistant that can answer questions, provide information, and help with various tasks. For more specialized needs, consider starting a chat with a specific workflow.";
  }
  
  if (query.toLowerCase().includes('what') && query.toLowerCase().includes('you')) {
    return "I'm a general purpose AI assistant designed to help with a wide range of questions and tasks. I can provide information, answer questions, and offer suggestions. For specialized tasks, you might want to use one of our workflow-specific agents.";
  }
  
  if (query.toLowerCase().includes('time') || query.toLowerCase().includes('date')) {
    return `The current time and date is ${new Date().toLocaleString()}. Note that this is the server time and may differ from your local time.`;
  }
  
  // Default response for other queries
  return `I understand you're asking about "${query}". In a full implementation, I would provide a comprehensive answer by searching my knowledge base and using tools like web search when needed. Would you like me to help with anything specific?`;
}

// Define types
type AgentInfo = (typeof agents)[0];

type Message = {
  id: string;
  role: 'user' | 'agent' | 'router';
  content: string;
  agent?: AgentInfo;
  agentId?: string;
  timestamp: Date;
  thinking?: string;
  isLoading?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  workflowId?: string;
  activeTasks: SubTask[];
};

export function EnhancedMultiAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<SubTask[]>([]);
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('anp-chat-history') || '[]');
      const currentId = localStorage.getItem('anp-current-chat-id');
      
      // Convert string dates to Date objects
      const convertedHistory = savedHistory.map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      
      setChatHistory(convertedHistory);
      
      // If there's a current chat ID, load that chat
      if (currentId) {
        setCurrentChatId(currentId);
        const currentChat = convertedHistory.find((chat: ChatSession) => chat.id === currentId);
        
        if (currentChat) {
          setMessages(currentChat.messages);
          setActiveTasks(currentChat.activeTasks || []);
          
          // If the chat has a workflow, load it
          if (currentChat.workflowId) {
            const workflowItem = workflowRegistry.getWorkflow(currentChat.workflowId);
            if (workflowItem) {
              setActiveWorkflow(workflowItem.workflow);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  // Save current chat to localStorage when messages change
  useEffect(() => {
    const saveChatToHistory = () => {
      if (messages.length > 0 && !isLoading) {
        // Create a chat ID if we don't have one
        const chatId = currentChatId || `chat-${Date.now()}`;
        
        // Generate a title from the first user message
        const firstUserMessage = messages.find(m => m.role === 'user');
        let title = 'New Chat';
        if (firstUserMessage) {
          title = firstUserMessage.content.substring(0, 40);
          if (firstUserMessage.content.length > 40) title += '...';
        }
        
        // Create or update the current chat session
        const updatedChat: ChatSession = {
          id: chatId,
          title,
          timestamp: new Date(),
          messages: messages,
          activeTasks: activeTasks,
          workflowId: activeWorkflow?.id
        };
        
        // Update chat history (replace if exists, add if new)
        let updatedHistory = [...chatHistory];
        const existingIndex = updatedHistory.findIndex(chat => chat.id === chatId);
        
        if (existingIndex >= 0) {
          updatedHistory[existingIndex] = updatedChat;
        } else {
          updatedHistory = [updatedChat, ...updatedHistory];
        }
        
        // Update state
        setChatHistory(updatedHistory);
        setCurrentChatId(chatId);
        
        // Save to localStorage
        localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
        localStorage.setItem('anp-current-chat-id', chatId);
      }
    };
    
    // Only save completed messages (wait until loading is done)
    if (!isLoading) {
      saveChatToHistory();
    }
  }, [messages, activeTasks, isLoading, currentChatId, activeWorkflow]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // When tasks are added, open the workflow panel
  useEffect(() => {
    if (activeTasks.length > 0) {
      setWorkflowPanelOpen(true);
    }
  }, [activeTasks.length]);

  // Focus on input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Helper function to add system messages
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'router',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  // Helper function to handle example click
  const handleExampleClick = (example: string) => {
    setInput(example);
    setShowExamples(false);
    
    // Focus the input after selecting an example
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle starting a new chat
  const startNewChat = () => {
    setMessages([]);
    setActiveTasks([]);
    setActiveWorkflow(null);
    setCurrentChatId(null);
    setShowWorkflowSelector(true);
    localStorage.removeItem('anp-current-chat-id');
  };

  // Handle workflow selection for new chat
  const handleWorkflowSelect = (workflow: Workflow | null) => {
    setActiveWorkflow(workflow);
    
    if (workflow) {
      addSystemMessage(`Started new chat with "${workflow.name}" workflow`);
      
      // If this is a brand new chat, initialize the workflow engine
      const chatId = currentChatId || `chat-${Date.now()}`;
      setCurrentChatId(chatId);
      
      // Initialize the workflow in the engine
      workflowEngine.executeWorkflow(workflow, chatId, {
        variables: {
          chatStartTime: new Date().toISOString()
        }
      });
    }
  };

  // Handle selecting a chat from history
  const handleSelectChat = (chatId: string) => {
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setActiveTasks(selectedChat.activeTasks || []);
      setCurrentChatId(chatId);
      
      // Load the workflow if one is associated with this chat
      if (selectedChat.workflowId) {
        const workflowItem = workflowRegistry.getWorkflow(selectedChat.workflowId);
        if (workflowItem) {
          setActiveWorkflow(workflowItem.workflow);
        }
      } else {
        setActiveWorkflow(null);
      }
      
      localStorage.setItem('anp-current-chat-id', chatId);
    }
    
    setShowChatHistory(false);
  };

  // Handle clearing chat history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setChatHistory([]);
      localStorage.removeItem('anp-chat-history');
      localStorage.removeItem('anp-current-chat-id');
      
      startNewChat();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowExamples(false);
    
    try {
      const chatId = currentChatId || `chat-${Date.now()}`;
      
      if (!currentChatId) {
        setCurrentChatId(chatId);
      }
      
      // If we have an active workflow, use the task router with workflow context
      if (activeWorkflow) {
        const workflowContext = workflowEngine.getExecutionState(activeWorkflow.id, chatId);
        
        // Route the task through the universal query router
        const decomposedTask = await taskRouter.routeTask(input, {
          workflowContext: workflowContext ? {
            workflowId: activeWorkflow.id,
            chatId,
            variables: [],
            status: workflowContext.status,
            progress: 0
          } : undefined
        });
        
        // Add tasks to workflow engine and state
        if (decomposedTask.subtasks.length > 0) {
          setActiveTasks(prev => [...prev, ...decomposedTask.subtasks]);
          
          if (activeWorkflow) {
            workflowEngine.addTaskToWorkflow(activeWorkflow.id, chatId, decomposedTask);
          }
        }
        
        // Start executing the tasks
        const results = await taskRouter.executeTask(decomposedTask);
        
        // Add agent response for each completed subtask
        for (const subtask of decomposedTask.subtasks) {
          if (subtask.status === 'completed' && subtask.result) {
            // Find the agent (for display purposes)
            const agent = agents.find(a => a.id === subtask.agentId) || {
              id: subtask.agentId,
              name: `Agent ${subtask.agentId}`,
              description: 'Task processing agent',
              knowledge_sources: [],
              tools: [],
              stake: 500,
              privacy_level: 'low'
            };
            
            // Add the response to messages
            const agentMessage: Message = {
              id: `agent-${Date.now()}-${subtask.id}`,
              role: 'agent',
              content: subtask.result.toString(),
              agent,
              agentId: subtask.agentId,
              timestamp: new Date(),
              thinking: `Task: ${subtask.description}\nConfidence: ${subtask.confidence.toFixed(2)}`
            };
            
            setMessages(prev => [...prev, agentMessage]);
          }
        }
      } else {
        // No workflow - use a simple mock response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use the general purpose agent for non-workflow queries
        const generalAgent = agents.find(a => a.id === 'general_purpose') || agents[0];
        
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `I'll help answer your question about "${input}".\n\n${mockGenerateResponse(input)}`,
          agent: generalAgent,
          agentId: generalAgent.id,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      addSystemMessage(`Error: Failed to process your request. ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 z-30 transition-transform duration-300 transform ${
          showChatHistory ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:w-80 md:flex md:flex-col top-16 h-[calc(100vh-4rem)]`}
      >
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle size={16} />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length > 0 ? (
            <div className="space-y-1 p-2">
              {chatHistory.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 ${
                    chat.id === currentChatId ? 'bg-purple-50 border-purple-200 border' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    {chat.workflowId && (
                      <div className="ml-2 flex-shrink-0">
                        <GitBranch size={14} className="text-purple-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="text-sm">No chat history</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleClearHistory}
          >
            Clear History
          </Button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full overflow-hidden h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="border-b border-gray-200 bg-white p-3 flex items-center justify-between z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden mr-2" 
              onClick={() => setShowChatHistory(!showChatHistory)}
            >
              {showChatHistory ? (
                <ArrowLeft size={20} />
              ) : (
                <History size={20} />
              )}
            </Button>
            
            <div>
              <h2 className="text-lg font-semibold">
                {activeWorkflow ? activeWorkflow.name : 'Chat'}
              </h2>
              {activeWorkflow && (
                <p className="text-xs text-gray-500">{activeWorkflow.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={startNewChat}
              className="flex items-center px-3 py-1.5 rounded-md text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
            >
              <PlusCircle size={16} className="mr-1" />
              New Chat
            </Button>
            
            {activeTasks.length > 0 && (
              <Button 
                onClick={() => setWorkflowPanelOpen(true)}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-100 hover:text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                <Zap size={16} className="mr-1 text-amber-500" />
                View Workflow
              </Button>
            )}
            
            <Button className="p-2 rounded-md text-gray-500 hover:bg-gray-100" title="Settings" variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
          </div>
        </div>
        
        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-2xl w-full">
                <h1 className="text-2xl font-bold text-center mb-6">Welcome to Multi-Agent Chat</h1>
                
                {!activeWorkflow ? (
                  <div className="text-center mb-8 space-y-4">
                    <p className="text-gray-600">
                      Start by selecting a workflow or ask me any question directly. I have a general purpose assistant ready to help!
                    </p>
                    <Button 
                      onClick={() => setShowWorkflowSelector(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      Select a Workflow
                    </Button>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center text-purple-700 font-medium mb-2">
                      <GitBranch className="mr-2 h-5 w-5" />
                      {activeWorkflow.name}
                    </div>
                    <p className="text-sm text-gray-600">
                      {activeWorkflow.description}
                    </p>
                  </div>
                )}
                
                {showExamples && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      Try asking about:
                    </h3>
                    
                    <div className="grid gap-2">
                      <button
                        onClick={() => handleExampleClick("Find tech companies that might need my consulting services.")}
                        className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Find tech companies that might need my consulting services.
                      </button>
                      
                      <button
                        onClick={() => handleExampleClick("Research the legal requirements for a fintech startup in Europe.")}
                        className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Research the legal requirements for a fintech startup in Europe.
                      </button>
                      
                      <button
                        onClick={() => handleExampleClick("Create content ideas for my new productivity app.")}
                        className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Create content ideas for my new productivity app.
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold mr-3 text-sm">
                          Y
                        </div>
                        <div className="flex-1 min-w-0 break-words">
                          <p className="text-gray-900">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ) : message.role === 'agent' ? (
                    <AgentResponse message={message} />
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-gray-500" />
                      {message.content}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold mr-3 text-sm">
                      AI
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                        <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse delay-300"></div>
                        <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse delay-600"></div>
                        <span className="text-sm text-gray-500 ml-1">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                style={{ minHeight: '60px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="absolute right-3 bottom-3 text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <SendHorizontal className="h-5 w-5" />
              </button>
            </form>
            
            <div className="flex items-center space-x-3 mt-2">
              {/* Example queries button (if no messages yet) */}
              {messages.length === 0 && !showExamples && (
                <button 
                  className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                  onClick={() => setShowExamples(true)}
                >
                  <Sparkles className="inline-block h-3 w-3 mr-1" />
                  Show examples
                </button>
              )}
              
              {/* AI model info */}
              <div className="text-xs text-gray-400 flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                <span>Multi-agent processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Workflow Panel */}
      <EnhancedWorkflowPanel
        workflowId={activeWorkflow?.id}
        chatId={currentChatId || undefined}
        tasks={activeTasks}
        open={workflowPanelOpen}
        onClose={() => setWorkflowPanelOpen(false)}
      />
      
      {/* Workflow Selector */}
      <WorkflowSelector
        isOpen={showWorkflowSelector}
        onClose={() => setShowWorkflowSelector(false)}
        onSelectWorkflow={handleWorkflowSelect}
      />
    </div>
  );
} 