# Integration Guide

This guide shows how to integrate different AI agent frameworks with the Agent Communication Protocol (ACP).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Framework-Specific Integration](#framework-specific-integration)
   - [LangChain](#integrating-langchain)
   - [CrewAI](#integrating-crewai)
   - [OpenAI Assistants](#integrating-openai-assistants)
   - [AutoGPT](#integrating-autogpt)
3. [Building Custom Adapters](#building-custom-adapters)
4. [Best Practices](#best-practices)

## Quick Start

### 1. Install Dependencies

```bash
npm install uuid
```

### 2. Import Protocol Components

```typescript
import { agentRegistry } from '@/lib/protocol/services/AgentRegistryService';
import { messageRouter } from '@/lib/protocol/services/MessageRouterService';
import { AdapterFactory } from '@/lib/protocol/adapters';
import {
  AgentFramework,
  AgentStatus,
  CapabilityCategory,
} from '@/types/agentCommunicationProtocol';
```

### 3. Register Your Agent

```typescript
const myAgent = {
  id: 'my-agent-001',
  name: 'My Custom Agent',
  description: 'Description of what the agent does',
  version: '1.0.0',
  framework: AgentFramework.CUSTOM,
  capabilities: [
    {
      id: 'capability1',
      name: 'Capability Name',
      category: CapabilityCategory.GENERAL,
      description: 'What this capability does',
    }
  ],
  tags: ['tag1', 'tag2'],
  status: AgentStatus.IDLE,
};

await agentRegistry.register(myAgent);
```

### 4. Subscribe to Messages

```typescript
messageRouter.subscribe('my-agent-001', async (message) => {
  console.log('Received message:', message);
  // Handle the message
});
```

## Framework-Specific Integration

## Integrating LangChain

### Overview
LangChain is a framework for developing applications powered by language models. The ACP adapter translates between LangChain's message format and ACP messages.

### Setup

```typescript
import { AdapterFactory } from '@/lib/protocol/adapters';
import { AgentFramework } from '@/types/agentCommunicationProtocol';

// Get LangChain adapter
const adapter = AdapterFactory.getAdapter(AgentFramework.LANGCHAIN);
```

### Configuration

Define your LangChain agent configuration:

```typescript
const langchainConfig = {
  agent_type: 'chat-conversational-react-description',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
    },
    {
      name: 'calculator',
      description: 'Perform mathematical calculations',
    }
  ],
  memory: {
    type: 'buffer',
    max_tokens: 2000,
  },
  llm: {
    model: 'gpt-4',
    temperature: 0.7,
  }
};
```

### Extract Capabilities

```typescript
const capabilities = adapter.extractCapabilities(langchainConfig);
```

### Register Agent

```typescript
const langchainAgent = {
  id: 'langchain-agent-001',
  name: 'LangChain Research Agent',
  description: 'A research agent powered by LangChain',
  version: '1.0.0',
  framework: AgentFramework.LANGCHAIN,
  capabilities,
  tags: ['research', 'langchain'],
  status: AgentStatus.IDLE,
};

await agentRegistry.register(langchainAgent);
```

### Message Translation

```typescript
// Converting from LangChain to ACP
const langchainMessage = {
  type: 'ai',
  content: 'Here is my response',
  name: 'langchain-agent-001',
};

const acpMessage = adapter.toACPMessage(langchainMessage);

// Converting from ACP to LangChain
const langchainFormat = adapter.fromACPMessage(acpMessage);
```

### Complete Example

```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { Calculator } from 'langchain/tools/calculator';
import { WebBrowser } from 'langchain/tools/webbrowser';

// Initialize LangChain agent
const model = new ChatOpenAI({ temperature: 0.7 });
const tools = [new Calculator(), new WebBrowser()];
const executor = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: 'chat-conversational-react-description',
});

// Extract and register
const adapter = AdapterFactory.getAdapter(AgentFramework.LANGCHAIN);
const capabilities = adapter.extractCapabilities({
  agent_type: 'chat-conversational-react-description',
  tools: tools.map(t => ({ name: t.name, description: t.description })),
});

await agentRegistry.register({
  id: 'langchain-001',
  name: 'LangChain Agent',
  description: 'Conversational agent with tools',
  version: '1.0.0',
  framework: AgentFramework.LANGCHAIN,
  capabilities,
  tags: ['langchain', 'conversational'],
  status: AgentStatus.IDLE,
});

// Handle messages
messageRouter.subscribe('langchain-001', async (message) => {
  if (message.messageType === 'task_request') {
    const task = message.payload;
    
    // Execute with LangChain
    const result = await executor.call({
      input: task.description,
    });
    
    // Send response
    const response = createTaskComplete(
      'langchain-001',
      message.from,
      {
        taskId: task.taskId,
        result: result.output,
        summary: 'Task completed successfully',
      },
      message.messageId
    );
    
    await messageRouter.route(response);
  }
});
```

## Integrating CrewAI

### Overview
CrewAI enables orchestrating role-playing AI agents. The adapter handles crew composition and task delegation.

### Setup

```typescript
import { AdapterFactory } from '@/lib/protocol/adapters';
import { AgentFramework } from '@/types/agentCommunicationProtocol';

const adapter = AdapterFactory.getAdapter(AgentFramework.CREWAI);
```

### Configuration

```typescript
const crewaiConfig = {
  role: 'Senior Data Analyst',
  goal: 'Analyze data and provide actionable insights',
  backstory: 'You are an experienced data analyst...',
  tools: ['data_analysis', 'visualization'],
  allow_delegation: true,
  verbose: true,
};
```

### Register Agent

```typescript
const capabilities = adapter.extractCapabilities(crewaiConfig);

const crewaiAgent = {
  id: 'crewai-analyst-001',
  name: 'Data Analyst',
  description: crewaiConfig.goal,
  version: '1.0.0',
  framework: AgentFramework.CREWAI,
  capabilities,
  tags: ['data', 'analysis', 'crewai'],
  status: AgentStatus.IDLE,
};

await agentRegistry.register(crewaiAgent);
```

### Complete Example

```typescript
from crewai import Agent, Task, Crew
import asyncio

# Define CrewAI agent
analyst = Agent(
  role='Senior Data Analyst',
  goal='Analyze data and provide insights',
  backstory='Experienced analyst...',
  tools=[data_tool, visualization_tool],
  allow_delegation=True
)

# In TypeScript/JavaScript integration
messageRouter.subscribe('crewai-analyst-001', async (message) => {
  if (message.messageType === 'task_request') {
    const task = message.payload;
    
    // Execute CrewAI task
    // This would call your Python CrewAI implementation
    const result = await executeCrewAITask(analyst, task);
    
    const response = createTaskComplete(
      'crewai-analyst-001',
      message.from,
      {
        taskId: task.taskId,
        result: result,
        summary: 'Analysis completed',
      },
      message.messageId
    );
    
    await messageRouter.route(response);
  }
});
```

## Integrating OpenAI Assistants

### Overview
OpenAI Assistants API provides agents with code interpreter, file search, and function calling.

### Setup

```typescript
import OpenAI from 'openai';
import { AdapterFactory } from '@/lib/protocol/adapters';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const adapter = AdapterFactory.getAdapter(AgentFramework.OPENAI_ASSISTANTS);
```

### Create Assistant

```typescript
const assistant = await openai.beta.assistants.create({
  name: 'Data Analyzer',
  instructions: 'You are a data analysis expert...',
  tools: [
    { type: 'code_interpreter' },
    { type: 'file_search' }
  ],
  model: 'gpt-4-turbo',
});
```

### Register Agent

```typescript
const config = {
  model: 'gpt-4-turbo',
  instructions: 'You are a data analysis expert...',
  tools: [
    { type: 'code_interpreter' },
    { type: 'file_search' }
  ],
};

const capabilities = adapter.extractCapabilities(config);

await agentRegistry.register({
  id: assistant.id,
  name: 'OpenAI Data Analyzer',
  description: config.instructions,
  version: '1.0.0',
  framework: AgentFramework.OPENAI_ASSISTANTS,
  capabilities,
  tags: ['openai', 'analysis'],
  status: AgentStatus.IDLE,
});
```

### Complete Example

```typescript
// Subscribe to messages
messageRouter.subscribe(assistant.id, async (message) => {
  if (message.messageType === 'task_request') {
    const task = message.payload;
    
    // Create thread
    const thread = await openai.beta.threads.create();
    
    // Add message
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: task.description,
    });
    
    // Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    
    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    // Get messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data[0].content[0].text.value;
    
    // Send response
    const completeMsg = createTaskComplete(
      assistant.id,
      message.from,
      {
        taskId: task.taskId,
        result: response,
        summary: 'Task completed by OpenAI Assistant',
      },
      message.messageId
    );
    
    await messageRouter.route(completeMsg);
  }
});
```

## Integrating AutoGPT

### Overview
AutoGPT provides autonomous AI agents that can pursue goals independently.

### Setup

```typescript
import { AdapterFactory } from '@/lib/protocol/adapters';
const adapter = AdapterFactory.getAdapter(AgentFramework.AUTOGPT);
```

### Configuration

```typescript
const autogptConfig = {
  ai_name: 'ResearchBot',
  ai_role: 'An AI designed to research topics autonomously',
  ai_goals: [
    'Research the given topic thoroughly',
    'Compile findings into a report',
    'Identify key insights and trends'
  ],
  enabled_commands: ['web_search', 'read_file', 'write_file'],
  allow_file_operations: true,
};
```

### Register Agent

```typescript
const capabilities = adapter.extractCapabilities(autogptConfig);

await agentRegistry.register({
  id: 'autogpt-researcher-001',
  name: autogptConfig.ai_name,
  description: autogptConfig.ai_role,
  version: '1.0.0',
  framework: AgentFramework.AUTOGPT,
  capabilities,
  tags: ['autogpt', 'autonomous', 'research'],
  status: AgentStatus.IDLE,
});
```

## Building Custom Adapters

### Step 1: Extend BaseAdapter

```typescript
import { BaseAdapter } from '@/lib/protocol/adapters/BaseAdapter';
import {
  AgentFramework,
  AgentMessage,
  AgentCapability,
  TaskRequestPayload,
  TaskCompletePayload,
} from '@/types/agentCommunicationProtocol';

export class MyCustomAdapter extends BaseAdapter {
  framework = AgentFramework.CUSTOM;
  version = "1.0.0";

  toACPMessage(frameworkMessage: any): AgentMessage {
    // Convert your framework's message to ACP format
    return this.createACPMessage(
      MessageType.RESPONSE,
      frameworkMessage.agentId,
      frameworkMessage.target,
      frameworkMessage.content
    );
  }

  fromACPMessage(acpMessage: AgentMessage): any {
    // Convert ACP message to your framework's format
    return {
      agentId: acpMessage.from,
      target: acpMessage.to,
      content: acpMessage.payload,
    };
  }

  extractCapabilities(config: any): AgentCapability[] {
    // Extract capabilities from your framework's config
    return [];
  }

  async executeTask(
    task: TaskRequestPayload,
    context?: any
  ): Promise<TaskCompletePayload> {
    // Execute task using your framework
    return {
      taskId: task.taskId,
      result: {},
      summary: 'Task completed',
    };
  }

  supportsCapability(capability: string): boolean {
    // Check if your framework supports this capability
    return false;
  }
}
```

### Step 2: Register Adapter

```typescript
import { AdapterFactory } from '@/lib/protocol/adapters';

AdapterFactory.registerAdapter(
  AgentFramework.CUSTOM,
  new MyCustomAdapter()
);
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
messageRouter.subscribe('my-agent', async (message) => {
  try {
    // Process message
  } catch (error) {
    const errorMsg = createError(
      'my-agent',
      message.from,
      {
        code: 'EXECUTION_ERROR',
        message: error.message,
        recoverable: true,
      },
      message.messageId
    );
    await messageRouter.route(errorMsg);
  }
});
```

### 2. Progress Updates

Send progress updates for long-running tasks:

```typescript
const progressMsg = createMessage(
  MessageType.TASK_PROGRESS,
  'my-agent',
  'user',
  {
    taskId: task.taskId,
    progress: 50,
    currentStep: 'Analyzing data...',
  }
);
await messageRouter.route(progressMsg);
```

### 3. Capability Registration

Be specific about capabilities:

```typescript
capabilities: [
  {
    id: 'web_search',
    name: 'Web Search',
    category: CapabilityCategory.RESEARCH,
    description: 'Search the web using Google, Bing, or other search engines',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        maxResults: { type: 'number' },
      },
      required: ['query'],
    },
  }
]
```

### 4. Metric Tracking

Update metrics after each task:

```typescript
await agentRegistry.updateMetrics('my-agent', {
  taskCompleted: true,
  responseTime: executionTime,
  qualityScore: 0.95,
});
```

### 5. Context Preservation

Preserve context during handoffs:

```typescript
const handoffMsg = createHandoff('agent1', 'router', {
  taskId: task.taskId,
  reason: 'Requires specialized data analysis',
  context: {
    conversationHistory: messages.slice(-10),
    completedSteps: ['data_collection', 'cleaning'],
    remainingWork: 'Need to perform statistical analysis',
    relevantData: { dataset: '...', metadata: '...' },
  },
});
```

## Support

For questions or issues:
- Check the [Protocol Specification](./PROTOCOL.md)
- Review the [examples](../frontend/src/lib/protocol/__tests__)
- Open an issue on GitHub
