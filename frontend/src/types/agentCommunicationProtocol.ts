/**
 * Agent Communication Protocol (ACP)
 * 
 * A standardized protocol for AI agent communication that supports
 * multiple frameworks and enables seamless agent collaboration.
 */

// ============================================================================
// Core Protocol Types
// ============================================================================

/**
 * Protocol version following semantic versioning
 */
export const PROTOCOL_VERSION = "1.0.0";

/**
 * Message types supported by the protocol
 */
export enum MessageType {
  // Discovery & Registration
  DISCOVER = "discover",
  REGISTER = "register",
  UNREGISTER = "unregister",
  
  // Task Management
  TASK_REQUEST = "task_request",
  TASK_ACCEPT = "task_accept",
  TASK_REJECT = "task_reject",
  TASK_PROGRESS = "task_progress",
  TASK_COMPLETE = "task_complete",
  TASK_ERROR = "task_error",
  
  // Agent Collaboration
  HANDOFF = "handoff",
  COLLABORATE = "collaborate",
  DELEGATE = "delegate",
  
  // Information Exchange
  QUERY = "query",
  RESPONSE = "response",
  THOUGHT = "thought",
  CONTEXT = "context",
  
  // System
  HEARTBEAT = "heartbeat",
  ERROR = "error",
}

/**
 * Agent capability categories
 */
export enum CapabilityCategory {
  GENERAL = "general",
  RESEARCH = "research",
  DATA_ANALYSIS = "data_analysis",
  CONTENT_GENERATION = "content_generation",
  TASK_PLANNING = "task_planning",
  CODE_GENERATION = "code_generation",
  COMMUNICATION = "communication",
  INTEGRATION = "integration",
  SPECIALIZED = "specialized",
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
  inputSchema?: Record<string, any>; // JSON Schema for inputs
  outputSchema?: Record<string, any>; // JSON Schema for outputs
  examples?: string[];
  performance?: {
    successRate?: number;
    averageResponseTime?: number;
    totalExecutions?: number;
  };
}

/**
 * Agent metadata for discovery and routing
 */
export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  framework: AgentFramework;
  capabilities: AgentCapability[];
  tags: string[];
  status: AgentStatus;
  
  // Configuration
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Resource information
  tools?: string[];
  knowledgeSources?: string[];
  mcpServers?: string[];
  
  // Collaboration preferences
  collaborationScore?: number;
  preferredPartners?: string[]; // IDs of agents it works well with
  specializations?: string[];
  
  // Performance metrics
  metrics?: AgentMetrics;
}

/**
 * Agent framework identifiers
 */
export enum AgentFramework {
  CUSTOM = "custom",
  LANGCHAIN = "langchain",
  CREWAI = "crewai",
  AUTOGPT = "autogpt",
  OPENAI_ASSISTANTS = "openai_assistants",
  SEMANTIC_KERNEL = "semantic_kernel",
  LLAMAINDEX = "llamaindex",
  HAYSTACK = "haystack",
}

/**
 * Agent status
 */
export enum AgentStatus {
  IDLE = "idle",
  BUSY = "busy",
  OFFLINE = "offline",
  ERROR = "error",
}

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  averageQualityScore?: number;
  lastActiveTime: Date;
}

// ============================================================================
// Message Protocol
// ============================================================================

/**
 * Base message structure for all agent communications
 */
export interface AgentMessage<T = any> {
  // Protocol information
  protocol: string; // "ACP/1.0.0"
  messageType: MessageType;
  messageId: string;
  timestamp: string; // ISO 8601
  
  // Routing information
  from: string; // Agent ID
  to: string | string[]; // Agent ID(s) or "broadcast"
  replyTo?: string; // Message ID for threading
  conversationId?: string; // Thread grouping
  
  // Content
  payload: T;
  
  // Optional metadata
  priority?: "low" | "normal" | "high" | "urgent";
  ttl?: number; // Time to live in seconds
  encryption?: {
    algorithm: string;
    publicKey?: string;
  };
  signature?: string;
}

/**
 * Task request payload
 */
export interface TaskRequestPayload {
  taskId: string;
  title: string;
  description: string;
  requiredCapabilities: string[];
  inputData?: any;
  context?: {
    previousTasks?: string[];
    relatedAgents?: string[];
    userPreferences?: Record<string, any>;
  };
  constraints?: {
    deadline?: string; // ISO 8601
    maxCost?: number;
    quality?: "fast" | "balanced" | "thorough";
  };
}

/**
 * Task progress payload
 */
export interface TaskProgressPayload {
  taskId: string;
  progress: number; // 0-100
  currentStep?: string;
  estimatedCompletion?: string; // ISO 8601
  intermediateResults?: any;
  thoughts?: string[];
}

/**
 * Task completion payload
 */
export interface TaskCompletePayload {
  taskId: string;
  result: any;
  summary?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    toolsUsed?: string[];
    confidence?: number;
  };
  nextSteps?: string[];
}

/**
 * Handoff payload for agent-to-agent delegation
 */
export interface HandoffPayload {
  taskId: string;
  reason: string;
  targetAgent?: string; // Specific agent or null for router decision
  context: {
    conversationHistory?: any[];
    completedSteps?: string[];
    remainingWork?: string;
    relevantData?: any;
  };
  recommendations?: string[];
}

/**
 * Thought process payload for transparency
 */
export interface ThoughtPayload {
  taskId?: string;
  thought: string;
  reasoning?: string;
  alternatives?: string[];
  confidence?: number;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

// ============================================================================
// Protocol Adapters
// ============================================================================

/**
 * Adapter interface for integrating different agent frameworks
 */
export interface ProtocolAdapter {
  framework: AgentFramework;
  version: string;
  
  /**
   * Convert framework-specific message to ACP message
   */
  toACPMessage(frameworkMessage: any): AgentMessage;
  
  /**
   * Convert ACP message to framework-specific message
   */
  fromACPMessage(acpMessage: AgentMessage): any;
  
  /**
   * Extract agent capabilities from framework configuration
   */
  extractCapabilities(frameworkConfig: any): AgentCapability[];
  
  /**
   * Execute a task using the framework
   */
  executeTask(task: TaskRequestPayload, context?: any): Promise<TaskCompletePayload>;
  
  /**
   * Check if the framework supports a specific capability
   */
  supportsCapability(capability: string): boolean;
}

// ============================================================================
// Protocol Services
// ============================================================================

/**
 * Agent registry for discovery and routing
 */
export interface AgentRegistry {
  /**
   * Register a new agent
   */
  register(agent: AgentMetadata): Promise<void>;
  
  /**
   * Unregister an agent
   */
  unregister(agentId: string): Promise<void>;
  
  /**
   * Find agents by capability
   */
  findByCapability(capability: string): Promise<AgentMetadata[]>;
  
  /**
   * Find agents by tag
   */
  findByTag(tag: string): Promise<AgentMetadata[]>;
  
  /**
   * Get agent metadata
   */
  getAgent(agentId: string): Promise<AgentMetadata | null>;
  
  /**
   * List all registered agents
   */
  listAgents(filter?: {
    status?: AgentStatus;
    framework?: AgentFramework;
    capability?: string;
  }): Promise<AgentMetadata[]>;
}

/**
 * Message router for agent communication
 */
export interface MessageRouter {
  /**
   * Route a message to appropriate agent(s)
   */
  route(message: AgentMessage): Promise<void>;
  
  /**
   * Find best agent for a task
   */
  findBestAgent(task: TaskRequestPayload): Promise<string | null>;
  
  /**
   * Subscribe to messages for an agent
   */
  subscribe(agentId: string, handler: (message: AgentMessage) => void): void;
  
  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string): void;
}

// ============================================================================
// Collaboration Patterns
// ============================================================================

/**
 * Collaboration strategy types
 */
export enum CollaborationStrategy {
  SEQUENTIAL = "sequential", // Tasks executed one after another
  PARALLEL = "parallel",     // Tasks executed simultaneously
  HIERARCHICAL = "hierarchical", // Manager-worker pattern
  PEER_TO_PEER = "peer_to_peer", // Equal collaboration
  PIPELINE = "pipeline",     // Output of one feeds into next
}

/**
 * Collaboration request
 */
export interface CollaborationRequest {
  id: string;
  initiator: string;
  participants: string[];
  strategy: CollaborationStrategy;
  goal: string;
  tasks: TaskRequestPayload[];
  sharedContext?: any;
}

/**
 * Agent relationship types
 */
export enum RelationshipType {
  COMPLEMENTARY = "complementary", // Agents have complementary skills
  SEQUENTIAL = "sequential",       // Agent B typically follows Agent A
  COMPETITIVE = "competitive",     // Agents compete for same tasks
  SUPERVISOR = "supervisor",       // Hierarchical relationship
}

/**
 * Agent relationship definition
 */
export interface AgentRelationship {
  sourceAgent: string;
  targetAgent: string;
  type: RelationshipType;
  strength: number; // 0-1, based on successful collaborations
  history: {
    totalCollaborations: number;
    successfulCollaborations: number;
    lastCollaboration?: Date;
  };
}

// ============================================================================
// Configuration & Constants
// ============================================================================

export const PROTOCOL_CONSTANTS = {
  VERSION: PROTOCOL_VERSION,
  DEFAULT_TTL: 300, // 5 minutes
  MAX_MESSAGE_SIZE: 10 * 1024 * 1024, // 10MB
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  TASK_TIMEOUT: 300000, // 5 minutes
} as const;

export const ERROR_CODES = {
  // Agent Errors
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  AGENT_BUSY: "AGENT_BUSY",
  AGENT_OFFLINE: "AGENT_OFFLINE",
  AGENT_INCOMPATIBLE: "AGENT_INCOMPATIBLE",
  
  // Task Errors
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  TASK_TIMEOUT: "TASK_TIMEOUT",
  TASK_INVALID: "TASK_INVALID",
  CAPABILITY_MISSING: "CAPABILITY_MISSING",
  
  // Protocol Errors
  INVALID_MESSAGE: "INVALID_MESSAGE",
  PROTOCOL_VERSION_MISMATCH: "PROTOCOL_VERSION_MISMATCH",
  SERIALIZATION_ERROR: "SERIALIZATION_ERROR",
  
  // System Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
} as const;
