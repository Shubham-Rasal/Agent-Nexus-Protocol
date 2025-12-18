# Agent Communication Protocol (ACP)

## Overview

The Agent Communication Protocol (ACP) is a standardized protocol for AI agent communication that enables seamless collaboration between agents built with different frameworks. It provides a universal language for agents to discover each other, exchange messages, delegate tasks, and work together effectively.

## Key Features

### 🔌 Framework Agnostic
- Support for multiple agent frameworks (LangChain, CrewAI, AutoGPT, OpenAI Assistants, and more)
- Protocol adapters for seamless integration
- Easy to extend with custom adapters

### 🎯 Standardized Communication
- Consistent message format across all agents
- Type-safe message payloads
- Version negotiation support

### 🔍 Agent Discovery
- Capability-based agent discovery
- Tag-based searching
- Performance metrics for agent selection

### 🤝 Collaboration Patterns
- Task delegation and handoff
- Sequential and parallel execution
- Hierarchical agent structures
- Peer-to-peer collaboration

### 📊 Transparency
- Thought process sharing
- Progress tracking
- Context preservation

## Architecture

### Core Components

1. **Protocol Types** (`agentCommunicationProtocol.ts`)
   - Message formats and enums
   - Agent metadata structures
   - Capability definitions

2. **Protocol Adapters** (`lib/protocol/adapters/`)
   - Framework-specific adapters
   - Message translation
   - Capability extraction

3. **Protocol Services** (`lib/protocol/services/`)
   - Agent Registry: Manages agent registration and discovery
   - Message Router: Routes messages between agents

4. **Protocol Utils** (`lib/protocol/utils.ts`)
   - Message creation helpers
   - Validation functions
   - Serialization utilities

## Message Types

ACP supports the following message types:

### Discovery & Registration
- `DISCOVER`: Discover available agents
- `REGISTER`: Register a new agent
- `UNREGISTER`: Remove an agent

### Task Management
- `TASK_REQUEST`: Request a task to be performed
- `TASK_ACCEPT`: Accept a task
- `TASK_REJECT`: Reject a task
- `TASK_PROGRESS`: Report progress on a task
- `TASK_COMPLETE`: Report task completion
- `TASK_ERROR`: Report task failure

### Collaboration
- `HANDOFF`: Hand off a task to another agent
- `COLLABORATE`: Request collaboration
- `DELEGATE`: Delegate a subtask

### Information Exchange
- `QUERY`: Ask a question
- `RESPONSE`: Provide an answer
- `THOUGHT`: Share reasoning process
- `CONTEXT`: Share context information

### System
- `HEARTBEAT`: Keep-alive message
- `ERROR`: Report an error

## Usage Examples

### Registering an Agent

```typescript
import { agentRegistry } from '@/lib/protocol/services/AgentRegistryService';
import { AgentFramework, AgentStatus, CapabilityCategory } from '@/types/agentCommunicationProtocol';

const agent = {
  id: 'my-agent-001',
  name: 'Research Assistant',
  description: 'Specialized in research and information gathering',
  version: '1.0.0',
  framework: AgentFramework.LANGCHAIN,
  capabilities: [
    {
      id: 'web_search',
      name: 'Web Search',
      category: CapabilityCategory.RESEARCH,
      description: 'Can search the web for information',
    },
    {
      id: 'document_analysis',
      name: 'Document Analysis',
      category: CapabilityCategory.DATA_ANALYSIS,
      description: 'Can analyze and extract information from documents',
    }
  ],
  tags: ['research', 'analysis', 'information'],
  status: AgentStatus.IDLE,
  tools: ['web_search', 'pdf_reader'],
};

await agentRegistry.register(agent);
```

### Sending a Task Request

```typescript
import { createTaskRequest } from '@/lib/protocol/utils';

const taskMessage = createTaskRequest(
  'router-agent',
  'research-agent',
  {
    title: 'Research AI Safety',
    description: 'Find and summarize recent papers on AI safety',
    requiredCapabilities: ['web_search', 'document_analysis'],
    context: {
      userPreferences: {
        sourceTypes: ['academic', 'industry'],
      }
    },
    constraints: {
      deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      quality: 'thorough',
    }
  }
);

await messageRouter.route(taskMessage);
```

### Finding the Best Agent for a Task

```typescript
import { messageRouter } from '@/lib/protocol/services/MessageRouterService';

const task = {
  taskId: 'task-123',
  title: 'Analyze Sales Data',
  description: 'Analyze Q4 sales data and provide insights',
  requiredCapabilities: ['data_analysis', 'visualization'],
};

const bestAgentId = await messageRouter.findBestAgent(task);
console.log('Best agent for task:', bestAgentId);
```

### Using Framework Adapters

```typescript
import { AdapterFactory } from '@/lib/protocol/adapters';
import { AgentFramework } from '@/types/agentCommunicationProtocol';

// Get adapter for a specific framework
const langchainAdapter = AdapterFactory.getAdapter(AgentFramework.LANGCHAIN);

// Extract capabilities from framework configuration
const langchainConfig = {
  agent_type: 'chat-conversational-react-description',
  tools: [
    { name: 'search', description: 'Search the web' },
    { name: 'calculator', description: 'Perform calculations' }
  ],
  memory: { type: 'buffer' }
};

const capabilities = langchainAdapter.extractCapabilities(langchainConfig);
console.log('LangChain capabilities:', capabilities);

// Convert between formats
const acpMessage = langchainAdapter.toACPMessage(langchainMessage);
const frameworkMessage = langchainAdapter.fromACPMessage(acpMessage);
```

## Supported Frameworks

### LangChain
- **Version**: 0.2.0+
- **Capabilities**: Text generation, tool usage, conversation, reasoning
- **Features**: Memory management, chain composition, custom tools

### CrewAI
- **Version**: 0.1.0+
- **Capabilities**: Role-based execution, task delegation, collaborative work
- **Features**: Crew composition, hierarchical processing, task sequencing

### OpenAI Assistants
- **Version**: 2.0.0+
- **Capabilities**: Code interpreter, file search, function calling
- **Features**: Thread management, file uploads, streaming responses

### AutoGPT
- **Version**: 0.5.0+
- **Capabilities**: Autonomous execution, goal pursuit, self-critique
- **Features**: Command execution, file operations, memory management

## Protocol Specification

### Message Format

```typescript
interface AgentMessage<T> {
  // Protocol information
  protocol: string;           // "ACP/1.0.0"
  messageType: MessageType;   // Type of message
  messageId: string;          // Unique message ID
  timestamp: string;          // ISO 8601 timestamp
  
  // Routing information
  from: string;               // Sender agent ID
  to: string | string[];      // Recipient(s)
  replyTo?: string;           // For threading
  conversationId?: string;    // For grouping
  
  // Content
  payload: T;                 // Message-specific data
  
  // Optional metadata
  priority?: "low" | "normal" | "high" | "urgent";
  ttl?: number;               // Time to live (seconds)
}
```

### Task Request Payload

```typescript
interface TaskRequestPayload {
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
    deadline?: string;
    maxCost?: number;
    quality?: "fast" | "balanced" | "thorough";
  };
}
```

### Task Complete Payload

```typescript
interface TaskCompletePayload {
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
```

## Best Practices

### Agent Registration
1. Register agents with comprehensive capability definitions
2. Keep agent metadata up to date
3. Use meaningful tags for discovery
4. Update metrics after each task

### Message Handling
1. Always validate messages before processing
2. Check message expiration (TTL)
3. Handle errors gracefully
4. Provide informative error messages

### Task Execution
1. Break down complex tasks into subtasks
2. Share thought process for transparency
3. Report progress regularly
4. Provide detailed completion summaries

### Collaboration
1. Use handoffs when appropriate
2. Preserve context during handoffs
3. Select agents based on capabilities and metrics
4. Track agent relationships for better routing

## Error Handling

Common error codes:

- `AGENT_NOT_FOUND`: Requested agent doesn't exist
- `AGENT_BUSY`: Agent is currently processing another task
- `AGENT_OFFLINE`: Agent is not available
- `CAPABILITY_MISSING`: Agent lacks required capability
- `TASK_TIMEOUT`: Task execution exceeded time limit
- `INVALID_MESSAGE`: Message format is invalid
- `PROTOCOL_VERSION_MISMATCH`: Protocol versions incompatible

## Performance Considerations

### Agent Selection
The router scores agents based on:
- Success rate (40%)
- Response time (20%)
- Capability match strength (30%)
- Current availability (10%)

### Message History
- Default limit: 1000 messages
- Can be configured per deployment
- Old messages automatically removed

### Registry Indexing
- Capabilities indexed for fast lookup
- Tags indexed for search
- O(1) agent retrieval by ID

## Extension Points

### Custom Adapters
Create custom adapters for new frameworks:

```typescript
import { BaseAdapter } from '@/lib/protocol/adapters/BaseAdapter';

export class MyCustomAdapter extends BaseAdapter {
  framework = AgentFramework.CUSTOM;
  version = "1.0.0";
  
  // Implement required methods
  toACPMessage(frameworkMessage: any): AgentMessage { /* ... */ }
  fromACPMessage(acpMessage: AgentMessage): any { /* ... */ }
  extractCapabilities(config: any): AgentCapability[] { /* ... */ }
  executeTask(task: TaskRequestPayload): Promise<TaskCompletePayload> { /* ... */ }
  supportsCapability(capability: string): boolean { /* ... */ }
}
```

### Custom Message Types
Extend the protocol with custom message types as needed.

### Custom Capabilities
Define domain-specific capabilities for your use case.

## Future Enhancements

- [ ] Message encryption and authentication
- [ ] Distributed registry support
- [ ] Advanced routing algorithms (ML-based)
- [ ] Performance monitoring dashboard
- [ ] Protocol analytics and insights
- [ ] Multi-language support
- [ ] Plugin system for extensions

## Contributing

To add support for a new framework:
1. Create an adapter extending `BaseAdapter`
2. Implement all required methods
3. Register the adapter in `AdapterFactory`
4. Add tests for the adapter
5. Update documentation

## License

MIT License - See LICENSE file for details
