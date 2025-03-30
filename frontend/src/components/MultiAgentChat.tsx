"use client";

import { useState, useRef, useEffect } from 'react';
import { agents } from '@/app/agents.json';
import AgentResponse from '@/components/AgentResponse';
import WorkflowPanel from '@/components/WorkflowPanel';
import { SendHorizontal, Sparkles, AlertCircle, Info, ChevronDown, Settings, HelpCircle, Clock, Zap, History, PlusCircle, ArrowLeft } from 'lucide-react';
import TaskRouter from '@/components/TaskRouter';

type AgentInfo = (typeof agents)[0];

type Message = {
  id: string;
  role: 'user' | 'agent' | 'router' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  isLoading?: boolean;
  isThought?: boolean;
};

type SubTask = {
  id: string;
  description: string;
  agent: AgentInfo;
  status: 'pending' | 'in-progress' | 'completed';
  response?: string;
  thoughtProcess?: string;
};

// Type for stored chat sessions
type ChatSession = {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  activeTasks: SubTask[];
};

export default function MultiAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<SubTask[]>([]);
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isRouterActive, setIsRouterActive] = useState(false);
  const [routerDialogOpen, setRouterDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Common query terms for autocomplete
  const commonTerms = [
    "GDPR compliance", "data protection", "privacy policy", "data breach", "consent management",
    "legal requirements", "data processing", "user rights", "data subject access request",
    "regulatory frameworks", "data retention", "security measures", "compliance audit",
    "personal data", "information security", "cross-border data transfer", "data minimization",
    "privacy by design", "impact assessment", "accountability principle", "legitimate interest"
  ];
  
  // Load chat history from localStorage on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      const savedHistory = localStorage.getItem('anp-chat-history');
      if (savedHistory) {
        try {
          // Parse the JSON and ensure Date objects are properly reconstructed
          const parsedHistory: ChatSession[] = JSON.parse(savedHistory, (key, value) => {
            if (key === 'timestamp' || (key === 'messages' && Array.isArray(value))) {
              // For message arrays, convert timestamps in each message
              if (key === 'messages' && Array.isArray(value)) {
                return value.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }));
              }
              return new Date(value);
            }
            return value;
          });
          
          setChatHistory(parsedHistory);
          
          // Load most recent chat if available
          const currentChatId = localStorage.getItem('anp-current-chat-id');
          if (currentChatId) {
            const currentChat = parsedHistory.find(chat => chat.id === currentChatId);
            if (currentChat) {
              setCurrentChatId(currentChatId);
              setMessages(currentChat.messages);
              setActiveTasks(currentChat.activeTasks || []);
            }
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Reset if there's an error
          localStorage.removeItem('anp-chat-history');
          localStorage.removeItem('anp-current-chat-id');
        }
      }
    };
    
    loadChatHistory();
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
          activeTasks: activeTasks
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
  }, [messages, activeTasks, isLoading, currentChatId]);
  
  // Helper function to start a new chat
  const startNewChat = () => {
    // Save current chat first (if needed)
    if (messages.length > 0) {
      // The save will happen via the useEffect, just update the current ID to null
      setCurrentChatId(null);
    }
    
    // Clear current chat state
    setMessages([]);
    setActiveTasks([]);
    setShowChatHistory(false);
    setShowExamples(true);
    
    // Focus on input for new message
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper function to select a chat from history
  const selectChat = (chatId: string) => {
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setActiveTasks(selectedChat.activeTasks || []);
      setCurrentChatId(chatId);
      setShowChatHistory(false);
      
      // Save this as the current chat
      localStorage.setItem('anp-current-chat-id', chatId);
    }
  };

  // Helper function to delete a chat from history
  const deleteChat = (chatId: string, event: React.MouseEvent) => {
    // Stop the event from bubbling to parent (which would select the chat)
    event.stopPropagation();
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this chat?')) {
      const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
      setChatHistory(updatedHistory);
      localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
      
      // If we're deleting the current chat, start a new one
      if (currentChatId === chatId) {
        startNewChat();
      }
    }
  };

  // Helper function to format date for display
  const formatChatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date >= today) {
      return 'Today';
    }
    
    // Check if date is yesterday
    if (date >= yesterday) {
      return 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Helper function to add system messages
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };
  
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

  // Helper function to handle example click
  const handleExampleClick = (example: string) => {
    setInput(example);
    setShowExamples(false);
    
    // Focus the input after selecting an example
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Apply autocomplete suggestion by replacing the last word with the suggestion
  const applySuggestion = (suggestion: string) => {
    const words = input.split(' ');
    const lastWordIndex = words.length - 1;
    
    // If there's content, replace the last word with the suggestion
    if (lastWordIndex >= 0) {
      words[lastWordIndex] = suggestion;
      const newInput = words.join(' ');
      setInput(newInput);
      
      // Clear suggestions after applying
      setSuggestions([]);
      
      // Set focus back to the textarea
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Position cursor at the end
          const len = newInput.length;
          inputRef.current.selectionStart = len;
          inputRef.current.selectionEnd = len;
          
          // Update height
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
        }
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowExamples(false);
    
    // Activate the router
    setIsRouterActive(true);
    
    // Add system message - Protocol initialized
    addSystemMessage('Protocol initialized. Preparing query analysis...');
    
    // Simulate router processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add router message with task decomposition
    const routerMessage: Message = {
      id: `router-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'router',
      content: 'I\'ll decompose this query into subtasks and assign specialized agents.',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, routerMessage]);
    
    // Add system message - Breaking down query
    addSystemMessage('Breaking query into subtasks...');
    
    try {
      // Call our Smart Router API to decompose the task and assign agents
      const response = await fetch('/api/task-router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          minConfidence: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Router API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('No tasks returned from router');
      }
      
      // Get the tasks from the API response and update state
      const tasks: SubTask[] = data.tasks.map((task: any) => {
        // Find the agent assigned to this task using agent_id
        const assignedAgent = agents.find(agent => agent.id === task.agent_id) || 
          // Fallback to a random agent if no specific assignment or agent not found
          agents[Math.floor(Math.random() * agents.length)];
          
        return {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          description: task.subtask || task.description,
          agent: assignedAgent,
          status: 'pending'
        };
      });
      setActiveTasks(tasks);
      
      // Add system message - Found agents
      const agentNames = tasks.map(t => t.agent.name).join(', ');
      addSystemMessage(`Found ${tasks.length} agents: ${agentNames}`);
      addSystemMessage('Assigning subtasks to specialized agents...');
      
      // Deactivate the router as we're done with task assignment
      setIsRouterActive(false);
      
      // Process each subtask in sequence with delays to simulate work
      for (const task of tasks) {
        // Update task status to in-progress
        setActiveTasks(prev => 
          prev.map(t => t.id === task.id ? {...t, status: 'in-progress'} : t)
        );
        
        // Add system message - Agent working on task
        addSystemMessage(`${task.agent.name} is analyzing: ${task.description}`);
        
        // Add agent thinking process message
        const thinkingMessage: Message = {
          id: `agent-thinking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'agent',
          content: `Thinking about ${task.description.toLowerCase()}...`,
          timestamp: new Date(),
          agentId: task.agent.id,
          isLoading: true,
          isThought: true,
        };
        
        setMessages(prev => [...prev, thinkingMessage]);
        
        // Simulate agent working (random delay between 1-3 seconds)
        await new Promise(resolve => 
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );
        
        // Generate agent response and thought process
        const response = generateAgentResponse(task);
        const thoughtProcess = generateThoughtProcess(task);
        
        // Update task with response and thought process
        setActiveTasks(prev => 
          prev.map(t => t.id === task.id ? 
            {...t, status: 'completed', response, thoughtProcess} : t)
        );
        
        // Update agent thinking message
        setMessages(prev => 
          prev.map(m => 
            m.id === thinkingMessage.id ?
            {...m, content: `Completed analysis of ${task.description.toLowerCase()}`, isLoading: false} : m
          )
        );
        
        // Add system message - Agent completed task
        addSystemMessage(`${task.agent.name} completed analysis of ${task.description.toLowerCase()}`);
      }
      
      // Add system message - Combining answers
      addSystemMessage('All subtasks completed. Synthesizing final response...');
      
      // Add final synthesized response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalResponse: Message = {
        id: `router-final-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'router',
        content: generateFinalResponse(tasks, input),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, finalResponse]);
    } catch (error) {
      console.error('Error calling task router:', error);
      
      // Fallback to structured task generation in case of API failure
      addSystemMessage('Router encountered an issue. Falling back to local task decomposition...');
      
      // Generate random subtasks based on the input query (fallback method)
      const selectedAgentIndices = new Set();
      while (selectedAgentIndices.size < 3) {
        selectedAgentIndices.add(Math.floor(Math.random() * agents.length));
      }
      
      const selectedAgents = Array.from(selectedAgentIndices).map(i => agents[i as number]);
      const queryLower = input.toLowerCase();
      
      // Create structured task assignments based on the query and selected agents
      const structuredTasks = [
        {
          subtask: queryLower.includes('legal') || queryLower.includes('compliance') ? 
            'Analyze legal and regulatory requirements' : 'Research background information',
          agent_id: selectedAgents[0].id
        },
        {
          subtask: queryLower.includes('financial') || queryLower.includes('cost') ? 
            'Evaluate financial implications' : 'Analyze domain-specific factors',
          agent_id: selectedAgents[1].id
        },
        {
          subtask: queryLower.includes('risk') || queryLower.includes('security') ? 
            'Assess potential risks and mitigations' : 'Provide recommendations and next steps',
          agent_id: selectedAgents[2].id
        }
      ];
      
      // Convert structured tasks to SubTask objects
      const tasks: SubTask[] = structuredTasks.map(task => {
        const assignedAgent = agents.find(agent => agent.id === task.agent_id) || selectedAgents[0];
        return {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          description: task.subtask,
          agent: assignedAgent,
          status: 'pending'
        };
      });
      
      setActiveTasks(tasks);
      
      // Add system message - Found agents
      const agentNames = tasks.map(t => t.agent.name).join(', ');
      addSystemMessage(`Using fallback agents: ${agentNames}`);
      
      // Deactivate the router as we're done with task assignment
      setIsRouterActive(false);
      
      // Process each subtask in sequence with delays to simulate work
      for (const task of tasks) {
        // Update task status to in-progress
        setActiveTasks(prev => 
          prev.map(t => t.id === task.id ? {...t, status: 'in-progress'} : t)
        );
        
        // Add system message - Agent working on task
        addSystemMessage(`${task.agent.name} is analyzing: ${task.description}`);
        
        // Add agent thinking process message
        const thinkingMessage: Message = {
          id: `agent-thinking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'agent',
          content: `Thinking about ${task.description.toLowerCase()}...`,
          timestamp: new Date(),
          agentId: task.agent.id,
          isLoading: true,
          isThought: true,
        };
        
        setMessages(prev => [...prev, thinkingMessage]);
        
        // Simulate agent working (random delay between 1-3 seconds)
        await new Promise(resolve => 
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );
        
        // Generate agent response and thought process
        const response = generateAgentResponse(task);
        const thoughtProcess = generateThoughtProcess(task);
        
        // Update task with response and thought process
        setActiveTasks(prev => 
          prev.map(t => t.id === task.id ? 
            {...t, status: 'completed', response, thoughtProcess} : t)
        );
        
        // Update agent thinking message
        setMessages(prev => 
          prev.map(m => 
            m.id === thinkingMessage.id ?
            {...m, content: `Completed analysis of ${task.description.toLowerCase()}`, isLoading: false} : m
          )
        );
        
        // Add system message - Agent completed task
        addSystemMessage(`${task.agent.name} completed analysis of ${task.description.toLowerCase()}`);
      }
      
      // Add system message - Combining answers
      addSystemMessage('All subtasks completed. Synthesizing final response...');
      
      // Add final synthesized response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalResponse: Message = {
        id: `router-final-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'router',
        content: generateFinalResponse(tasks, input),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, finalResponse]);
    }
    
    // Add system message - Protocol completed
    addSystemMessage('Response synthesis complete. Protocol execution finished.');
    
    setIsLoading(false);
    
    // Focus the input after completion
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Calculate time elapsed since the first message
  const getElapsedTime = () => {
    if (messages.length === 0) return null;
    const firstMessageTime = messages[0].timestamp;
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - firstMessageTime.getTime()) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  };

  const elapsedTime = getElapsedTime();

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Chat History Sidebar */}
      <div className={`flex flex-col border-r border-gray-200 bg-gray-50 ${showChatHistory ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-700">Chat History</h2>
          <button 
            onClick={() => setShowChatHistory(false)}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        
        <div className="flex flex-col gap-1 p-2 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center p-4 text-gray-500 text-sm">
              No previous chats found
            </div>
          ) : (
            chatHistory.map(chat => {
              // Group chats by date
              const chatDate = formatChatDate(chat.timestamp);
              
              return (
                <div key={chat.id} className="flex flex-col">
                  <div 
                    onClick={() => selectChat(chat.id)}
                    className={`flex items-start p-3 rounded-md cursor-pointer hover:bg-gray-200 transition-colors ${chat.id === currentChatId ? 'bg-gray-200 border-l-4 border-purple-500' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900 truncate">{chat.title}</p>
                        <span className="text-xs text-gray-500">{chat.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{chatDate} · {chat.messages.length} messages</p>
                    </div>
                    <button 
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {!showChatHistory && (
              <button 
                onClick={() => setShowChatHistory(true)} 
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                title="View chat history"
              >
                <History size={20} />
              </button>
            )}
            <h2 className="font-medium text-gray-800">
              {messages.length > 0 ? (
                // Show truncated first message as title
                messages.find(m => m.role === 'user')?.content.substring(0, 40) + 
                (messages.find(m => m.role === 'user')?.content.length! > 40 ? '...' : '')
              ) : (
                'New Chat'
              )}
            </h2>
            
            {/* Display elapsed time if there are messages */}
            {messages.length > 0 && (
              <div className="flex items-center text-xs text-gray-500 ml-2">
                <Clock size={14} className="mr-1" />
                <span>
                  {(() => {
                    const firstMsg = messages[0]?.timestamp;
                    if (!firstMsg) return '';
                    
                    const elapsed = Math.floor((new Date().getTime() - firstMsg.getTime()) / 1000);
                    if (elapsed < 60) return `${elapsed}s`;
                    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
                    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
                  })()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={startNewChat}
              className="flex items-center px-3 py-1.5 rounded-md text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
            >
              <PlusCircle size={16} className="mr-1" />
              New Chat
            </button>
            
            {activeTasks.length > 0 && (
              <button 
                onClick={() => setWorkflowPanelOpen(true)}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                <Zap size={16} className="mr-1 text-amber-500" />
                View Workflow
              </button>
            )}
            
            <button 
              onClick={() => setRouterDialogOpen(true)} 
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100" 
              title="How it works"
            >
              <HelpCircle size={20} />
            </button>
            
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100" title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Messages Container */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="max-w-lg text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Agent Protocol Chat</h2>
                <p className="text-gray-500 mb-6">
                  Ask complex questions that require multiple specialized agents to solve.
                  The protocol will break down your query, route to relevant experts, and synthesize a comprehensive response.
                </p>
                
                {/* Example questions */}
                {showExamples && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      Try asking one of these questions:
                    </h3>
                    <div className="space-y-2">
                      {[
                        "What are the key differences between transformer and LSTM architectures for NLP?",
                        "How can I optimize a React application for better performance?",
                        "Explain quantum computing to a high school student."
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(example)}
                          className="w-full text-left p-2 rounded-md text-sm hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                // Create a composite key combining the message ID and index
                // This ensures uniqueness even if there are duplicate message IDs
                const messageKey = `${message.id}-index-${index}`;
                
                if (message.role === 'system') {
                  return (
                    <div key={messageKey} className="flex justify-center">
                      <div className="bg-gray-50 px-4 py-2 rounded-full flex items-center max-w-md">
                        <Info size={16} className="text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">{message.content}</span>
                      </div>
                    </div>
                  );
                }
                
                if (message.role === 'user') {
                  return (
                    <div key={messageKey} className="flex justify-end">
                      <div className="bg-purple-50 rounded-lg px-4 py-3 shadow-sm hover:shadow transition-shadow max-w-2xl">
                        <p className="text-gray-800">{message.content}</p>
                      </div>
                    </div>
                  );
                }
                
                if (message.role === 'router') {
                  if (message.isThought) {
                    // For router thoughts, we'll show them as system-style messages
                    return (
                      <div key={messageKey} className="flex justify-center">
                        <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center max-w-lg">
                          <AlertCircle size={14} className="text-blue-500 mr-2" />
                          <span className="text-xs text-gray-600 italic">{message.content}</span>
                        </div>
                      </div>
                    );
                  }
                
                  return (
                    <div key={messageKey} className="flex">
                      <div className="bg-white border border-purple-200 rounded-lg px-4 py-3 shadow-sm max-w-2xl">
                        <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  );
                }
                
                if (message.role === 'agent') {
                  // Find the agent info
                  const agent = agents.find(a => a.id === message.agentId);
                  
                  if (!agent) {
                    // If agent not found
                    return (
                      <div key={messageKey} className="flex">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm max-w-2xl">
                          <p className="text-gray-800">{message.content}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  // Use the AgentResponse component
                  return (
                    <AgentResponse 
                      key={messageKey} 
                      agent={agent} 
                      content={message.content} 
                      loading={message.isLoading || false}
                      isThought={message.isThought}
                    />
                  );
                }
                
                return null;
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      
        {/* Input section */}
        <div className="border-t border-gray-200 bg-white py-3 px-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 group">
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize the textarea based on content
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                  
                  // Generate suggestions based on input
                  if (e.target.value.trim().length > 2) {
                    const lastWord = e.target.value.split(' ').pop()?.toLowerCase() || '';
                    if (lastWord.length >= 3) {
                      const matchingSuggestions = commonTerms
                        .filter(term => term.toLowerCase().includes(lastWord))
                        .slice(0, 3); // Limit to 3 suggestions
                      setSuggestions(matchingSuggestions);
                      setActiveSuggestion(-1);
                    } else {
                      setSuggestions([]);
                    }
                  } else {
                    setSuggestions([]);
                  }
                }}
                onKeyDown={(e) => {
                  // Handle suggestion navigation with arrow keys
                  if (suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
                      return;
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveSuggestion(prev => Math.max(prev - 1, -1));
                      return;
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      // If a suggestion is active, apply it
                      if (activeSuggestion >= 0) {
                        applySuggestion(suggestions[activeSuggestion]);
                      } else if (suggestions.length > 0) {
                        // Apply first suggestion if none is active
                        applySuggestion(suggestions[0]);
                      }
                      return;
                    }
                  }
                
                  if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                    e.preventDefault(); // Prevent default to avoid new line
                    setSuggestions([]); // Clear suggestions
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about a complex topic... (Shift+Enter for new line)"
                className="w-full py-3 px-4 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-shadow shadow-sm hover:shadow resize-none min-h-[46px] max-h-[150px] overflow-y-auto leading-normal"
                style={{ height: '46px' }} // Initial height
                disabled={isLoading}
                rows={1}
              ></textarea>
              
              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && !isLoading && (
                <div className="absolute left-0 right-16 bottom-full mb-1 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden z-10">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${index === activeSuggestion ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                  <div className="px-2 py-1 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                    Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">Tab</kbd> to autocomplete, <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↑</kbd><kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↓</kbd> to navigate
                  </div>
                </div>
              )}
              
              {/* Character count */}
              {input.length > 0 && (
                <div className="absolute right-16 top-3 text-xs text-gray-400 pointer-events-none">
                  {input.length} {input.length === 1 ? 'char' : 'chars'}
                </div>
              )}
              
              {/* Clear button */}
              {input.trim() && (
                <button
                  onClick={() => {
                    setInput('');
                    // Reset height when cleared
                    if (inputRef.current) {
                      (inputRef.current as HTMLTextAreaElement).style.height = '46px';
                    }
                  }}
                  className="absolute right-2 top-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full group-hover:opacity-100 transition-opacity"
                  title="Clear input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center px-4 py-3 rounded-lg ${
                input.trim() && !isLoading 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
              title="Send message (Enter)"
            >
              <SendHorizontal className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Send</span>
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            {/* Status message */}
            <div className="flex items-center">
              {isLoading && (
                <>
                  <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
                  Processing your question with specialized agents...
                </>
              )}
              {!isLoading && !input && (
                <div className="flex items-center opacity-60">
                  <span className="hidden sm:inline mr-1">Press</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mr-1">Enter</kbd>
                  <span className="hidden sm:inline mr-1">to send, </span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mx-1">Shift</kbd>
                  <span className="hidden sm:inline">+</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mx-1">Enter</kbd>
                  <span className="hidden sm:inline">for new line</span>
                </div>
              )}
              {!isLoading && input && (
                <div className="flex items-center opacity-75">
                  <span className="text-purple-600 font-medium">{calculateComplexity(input)}</span>
                </div>
              )}
            </div>
            
            {/* Right side options */}
            <div className="flex items-center space-x-3">
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
      <WorkflowPanel
        open={workflowPanelOpen}
        onClose={() => setWorkflowPanelOpen(false)}
        tasks={activeTasks}
      />
      
      {/* TaskRouter Dialog */}
      {routerDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">How Agent Nexus Protocol Works</h2>
              <button 
                onClick={() => setRouterDialogOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                The Agent Nexus Protocol breaks down complex questions into specialized subtasks and routes them to the best agents
                based on their capabilities, stake in the network, and relationships with other agents.
              </p>
              <TaskRouter isActive={isRouterActive} />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <button 
                onClick={() => setRouterDialogOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for generating dummy content
function generateSubtasks(query: string, selectedAgents: AgentInfo[]): SubTask[] {
  const queryLower = query.toLowerCase();
  const tasks: SubTask[] = [];
  
  // Generate relevant subtasks based on query keywords and agent capabilities
  if (selectedAgents.length >= 3) {
    if (queryLower.includes('legal') || queryLower.includes('compliance') || queryLower.includes('regulation')) {
      tasks.push({
        id: `task-legal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Analyze legal and regulatory requirements',
        agent: selectedAgents[0],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Research background information',
        agent: selectedAgents[0],
        status: 'pending'
      });
    }
    
    if (queryLower.includes('financial') || queryLower.includes('cost') || queryLower.includes('money')) {
      tasks.push({
        id: `task-finance-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Evaluate financial implications',
        agent: selectedAgents[1],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-domain-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Analyze domain-specific factors',
        agent: selectedAgents[1],
        status: 'pending'
      });
    }
    
    if (queryLower.includes('risk') || queryLower.includes('security') || queryLower.includes('threat')) {
      tasks.push({
        id: `task-risk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Assess potential risks and mitigations',
        agent: selectedAgents[2],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-recommend-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Provide recommendations and next steps',
        agent: selectedAgents[2],
        status: 'pending'
      });
    }
  }
  
  return tasks;
}

// Helper function to generate agent responses
function generateAgentResponse(task: SubTask): string {
  const agentType = task.agent.id.split('_')[1];
  
  // Generate responses based on agent type and task description
  if (agentType === 'legal') {
    return `Based on my analysis of relevant legal frameworks, I can confirm that there are several regulatory considerations for ${task.description.toLowerCase()}:\n\n1. Compliance with local regulations requires careful documentation\n2. Potential liability issues should be addressed proactively\n3. Consider establishing a compliance monitoring framework`;
  } else if (agentType === 'finance' || agentType === 'crypto' || agentType === 'realestate') {
    return `From a financial perspective, ${task.description.toLowerCase()} presents both opportunities and challenges:\n\n• Initial investment: approximately $50,000 - $75,000\n• Expected ROI: 15-20% within first 18 months\n• Key risk factors: market volatility, regulatory changes\n• Recommend phased implementation to manage cash flow`;
  } else if (agentType === 'health' || agentType === 'food') {
    return `Health assessment for ${task.description.toLowerCase()}:\n\n• Primary benefits: improved wellbeing metrics in 83% of cases\n• Potential concerns: requires proper implementation protocols\n• Compliance with health regulations in all relevant jurisdictions\n• Recommendation: proceed with appropriate safety monitoring`;
  } else if (agentType === 'tech' || agentType === 'cyber' || agentType === 'ai') {
    return `Technical analysis of ${task.description.toLowerCase()}:\n\n• Implementation complexity: Medium\n• Key technologies required: cloud infrastructure, data encryption\n• Security considerations: data handling protocols needed\n• Timeline: approximately 2-3 months for full deployment`;
  } else {
    return `I've completed my analysis of ${task.description.toLowerCase()} and found that:\n\n• Multiple approaches are viable depending on priorities\n• Key success factors include thorough planning and stakeholder engagement\n• Common pitfalls can be avoided through regular assessment\n• Recommendation: proceed with a structured implementation plan`;
  }
}

// Generate thought process logs that would be shown in the workflow panel
function generateThoughtProcess(task: SubTask): string {
  const agentType = task.agent.id.split('_')[1];
  
  if (agentType === 'legal') {
    return `1. Query received: "${task.description}"\n2. Accessing legal knowledge base...\n3. Found 17 relevant regulations\n4. Analyzing applicability to current context\n5. Identifying key compliance requirements\n6. Evaluating documentation needs\n7. Checking for jurisdictional variations\n8. Determining potential liability issues\n9. Formulating monitoring recommendations\n10. Finalizing analysis with confidence score: 87%`;
  } else if (agentType === 'finance' || agentType === 'crypto' || agentType === 'realestate') {
    return `1. Query received: "${task.description}"\n2. Accessing financial models...\n3. Building cash flow projections\n4. Estimating initial investment requirements\n5. Calculating expected ROI based on market benchmarks\n6. Identifying key risk factors from similar ventures\n7. Analyzing market volatility impact\n8. Testing sensitivity to regulatory changes\n9. Evaluating implementation approaches\n10. Finalizing recommendations with confidence score: 92%`;
  } else if (agentType === 'health' || agentType === 'food') {
    return `1. Query received: "${task.description}"\n2. Accessing health databases...\n3. Reviewing clinical outcomes data\n4. Analyzing wellbeing metrics from similar initiatives\n5. Identifying potential implementation concerns\n6. Checking regulatory compliance requirements\n7. Evaluating safety considerations\n8. Assessing risk/benefit profile\n9. Determining monitoring protocols\n10. Finalizing assessment with confidence score: 89%`;
  } else if (agentType === 'tech' || agentType === 'cyber' || agentType === 'ai') {
    return `1. Query received: "${task.description}"\n2. Accessing technology knowledge graphs...\n3. Determining technical requirements\n4. Evaluating implementation complexity\n5. Identifying necessary infrastructure components\n6. Analyzing security considerations\n7. Assessing data handling requirements\n8. Estimating deployment timeline\n9. Mapping potential integration points\n10. Finalizing technical analysis with confidence score: 94%`;
  } else {
    return `1. Query received: "${task.description}"\n2. Accessing general knowledge base...\n3. Identifying relevant domains and approaches\n4. Evaluating success factors from similar cases\n5. Analyzing common implementation pitfalls\n6. Determining stakeholder considerations\n7. Assessing planning requirements\n8. Estimating resource needs\n9. Formulating structured implementation plan\n10. Finalizing recommendations with confidence score: 85%`;
  }
}

// Helper function to generate a final synthesized response
function generateFinalResponse(tasks: SubTask[], query: string): string {
  const queryLower = query.toLowerCase();
  
  let introduction = '';
  if (queryLower.includes('legal') || queryLower.includes('compliance')) {
    introduction = "Based on our comprehensive legal and regulatory analysis";
  } else if (queryLower.includes('financial') || queryLower.includes('cost')) {
    introduction = "After evaluating the financial implications and economic factors";
  } else if (queryLower.includes('risk') || queryLower.includes('security')) {
    introduction = "Following our thorough risk assessment and security evaluation";
  } else if (queryLower.includes('health') || queryLower.includes('medical')) {
    introduction = "Based on health data analysis and medical expertise";
  } else {
    introduction = "After comprehensive analysis across multiple domains";
  }
  
  return `${introduction}, here's a synthesized answer to your query:\n\n${tasks.map(task => 
    `• ${task.description}: ${task.response?.split('\n')[0]}`
  ).join('\n\n')}\n\nIn conclusion, there are several important factors to consider and a structured approach is recommended. Would you like more detailed information on any specific aspect?`;
}

// Helper function to analyze query complexity for UI feedback
function calculateComplexity(query: string): string {
  const length = query.length;
  const words = query.split(/\s+/).filter(Boolean).length;
  const sentences = query.split(/[.!?]+/).filter(Boolean).length;
  const specialTerms = [
    'legal', 'financial', 'technical', 'medical', 'scientific', 'analysis', 
    'compare', 'contrast', 'evaluate', 'explain', 'synthesize', 'breakdown',
    'implications', 'consequences', 'benefits', 'drawbacks', 'advantages',
    'security', 'privacy', 'regulations', 'compliance', 'framework'
  ].filter(term => query.toLowerCase().includes(term)).length;
  
  // Calculate a complexity score
  let score = 0;
  
  // Length-based complexity
  if (length > 200) score += 3;
  else if (length > 100) score += 2;
  else if (length > 50) score += 1;
  
  // Word count complexity
  if (words > 40) score += 3;
  else if (words > 20) score += 2;
  else if (words > 10) score += 1;
  
  // Sentence structure complexity
  if (sentences > 3) score += 2;
  else if (sentences > 1) score += 1;
  
  // Special terms complexity
  score += Math.min(3, specialTerms);
  
  // Determine the complexity label
  if (score >= 8) return "Complex query - multiple agents needed";
  if (score >= 5) return "Moderate complexity";
  if (score >= 3) return "Simple query";
  return "Basic query";
} 