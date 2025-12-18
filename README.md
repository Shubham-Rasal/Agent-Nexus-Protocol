

## 🎯 Groundline

> ⚠️ ⚠️ ⚠️ **Alert:** This section describes the Groundline integration in ANP!


> 🆕 Recently developed during the PL_Genesis hackathon!

We integrated Groundline, our powerful graph database package, to manage knowledge graphs with IPFS persistence:

- Published as an **npm package** (`groundline-mcp`) for easy integration
- Built-in **IPFS persistence** for decentralized storage of graph data
- Integrated with **FileCDN PDPs** using Synapse SDK for graph interactions
- Powers the **MCP server** backend for efficient graph operations
- Supports multiple knowledge graph sources including Wikidata, DBpedia, and OpenAlex

Check out the implementation in our [groundline package](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/tree/master/groundline) and read more about its features in the [Groundline README](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/groundline/README.md)!

![image](https://github.com/user-attachments/assets/c4956ade-0296-42ca-9607-8ed7006738f4)

### Provenance Tracking 
![image](https://github.com/user-attachments/assets/2b2d5c36-4ee8-40da-a429-4ac1259f16a7)

### MCP server built using Groundline SDK

![image](https://github.com/user-attachments/assets/2564dbba-d45e-4b13-b37c-63fb790f0090)

![image](https://github.com/user-attachments/assets/62681ece-c0df-4ae1-8673-9849b070d48b)

## Grounding in External Knowledge Graphs (Wiki Data, DBPedia, etc)

![image](https://github.com/user-attachments/assets/64a006c0-2278-4791-9312-2a8858278125)




---

# Agent Nexus Protocol (ANP)

## 🌟 Overview

Agent Nexus Protocol (ANP) is a comprehensive AI agent communication protocol that enables seamless collaboration between agents built with different frameworks. It provides a standardized way for AI agents to discover each other, exchange messages, delegate tasks, and work together to solve complex problems.

![image](https://github.com/user-attachments/assets/17ca4ac7-4f6a-4de6-8e56-192ef9656391)

## 🚀 Key Features

### 🔌 Universal Agent Communication Protocol (ACP)
- **Framework Agnostic**: Support for LangChain, CrewAI, AutoGPT, OpenAI Assistants, and more
- **Protocol Adapters**: Seamlessly integrate agents from different frameworks
- **Standardized Messaging**: Consistent message format with version negotiation
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### 🤝 Advanced Collaboration
- **Standardized Collaboration Protocol**: Interface for AI agents to collaborate seamlessly, allowing agents to exchange information, requests, and results in a structured way
- **Task Delegation & Handoff**: Intelligent task distribution and agent-to-agent handoffs
- **Multiple Collaboration Patterns**: Sequential, parallel, hierarchical, and peer-to-peer execution
- **Context Preservation**: Maintains conversation context during agent transitions

### 🔍 Intelligent Agent Discovery
- **Capability-Based Discovery**: Find agents by their specific capabilities
- **Performance Metrics**: Select agents based on success rates and response times
- **Tag-Based Search**: Organize and discover agents using flexible tagging

### 🧠 Smart Routing & Transparency
- **Intelligent Routing**: Smart traffic controller that analyzes tasks and routes them to agents with the right expertise - whether that's researching information, drafting emails, or analyzing data
- **Chain of Thought Sharing**: Agents share their thinking process along the way, enabling other agents to see not just conclusions but the reasoning behind them
- **Progress Tracking**: Real-time task progress updates and intermediate results

### 🛠️ Model Context Protocol (MCP) Integration
- **Tool Support**: Access to wide variety of tools through MCP servers
- **Standardized Tool Interface**: Consistent tool integration across all agents
- **Custom MCP Servers**: Easy to add domain-specific tools

## 📚 Documentation

- **[Protocol Specification](./docs/PROTOCOL.md)**: Complete ACP protocol documentation
- **[Integration Guide](./docs/PROTOCOL.md#usage-examples)**: How to integrate different agent frameworks
- **[API Reference](./docs/PROTOCOL.md#protocol-specification)**: Detailed API documentation

## 🎯 Supported Agent Frameworks

ANP provides native support for major AI agent frameworks:

| Framework | Version | Status | Capabilities |
|-----------|---------|--------|--------------|
| **LangChain** | 0.2.0+ | ✅ Supported | Tool usage, conversation, memory management |
| **CrewAI** | 0.1.0+ | ✅ Supported | Role-based execution, task delegation, crews |
| **OpenAI Assistants** | 2.0.0+ | ✅ Supported | Code interpreter, file search, function calling |
| **AutoGPT** | 0.5.0+ | ✅ Supported | Autonomous execution, goal pursuit, self-critique |
| **Custom** | - | ✅ Supported | Extend with custom adapters |

### Adding New Frameworks

Create a custom adapter by extending the `BaseAdapter` class:

```typescript
import { BaseAdapter } from '@/lib/protocol/adapters/BaseAdapter';

export class MyFrameworkAdapter extends BaseAdapter {
  // Implement required methods for your framework
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Applications                     │
│  (LangChain, CrewAI, AutoGPT, OpenAI Assistants, etc.)  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Protocol Adapters Layer                     │
│   (Translate framework-specific to ACP messages)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│        Agent Communication Protocol (ACP)                │
│  • Message Router    • Agent Registry                    │
│  • Task Management   • Capability Discovery              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Transport Layer (MCP/HTTP/WS)               │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/Shubham-Rasal/Agent-Nexus-Protocol
cd Agent-Nexus-Protocol/frontend
npm install
npm run dev
```

### Register an Agent

```typescript
import { agentRegistry } from '@/lib/protocol/services/AgentRegistryService';
import { AgentFramework, AgentStatus, CapabilityCategory } from '@/types/agentCommunicationProtocol';

const myAgent = {
  id: 'research-agent-001',
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
    }
  ],
  tags: ['research', 'analysis'],
  status: AgentStatus.IDLE,
};

await agentRegistry.register(myAgent);
```

### Send a Task Request

```typescript
import { createTaskRequest } from '@/lib/protocol/utils';
import { messageRouter } from '@/lib/protocol/services/MessageRouterService';

const task = createTaskRequest('user', 'router', {
  title: 'Research AI Safety',
  description: 'Find and summarize recent papers on AI safety',
  requiredCapabilities: ['web_search', 'document_analysis'],
});

await messageRouter.route(task);
```

## Screenshots

![Screenshot from 2025-04-13 21-24-49](https://github.com/user-attachments/assets/7951944b-d180-4242-9847-4d8a14ccbc00)
![Screenshot from 2025-04-13 21-24-53](https://github.com/user-attachments/assets/ae0aa763-7bdf-41f5-8dec-29cb7be9f76e)
![Screenshot from 2025-04-13 21-27-05](https://github.com/user-attachments/assets/855ee90c-1373-4488-8285-88154a606bec)
![Screenshot from 2025-04-13 21-27-11](https://github.com/user-attachments/assets/ae584d0d-9ab9-4194-a725-3d231bd0b8ee)

![Screenshot from 2025-04-13 21-27-21](https://github.com/user-attachments/assets/3e18a70d-2b47-4145-bf2a-15be67b11f00)

![Screenshot from 2025-04-13 21-27-33](https://github.com/user-attachments/assets/47cb09c8-78c0-4865-94b7-5d8715b875c7)


![Screenshot from 2025-04-13 21-27-45](https://github.com/user-attachments/assets/05746197-ff02-4a5c-a0e7-ed61d4f005de)

![Screenshot from 2025-04-13 21-33-18](https://github.com/user-attachments/assets/cb67a732-7702-4009-8009-3674fce92d44)



## 🔧 Installation (Legacy)

1. Clone the repository:
```bash
git clone https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol
cd ANP---Agent-Nexus-Protocol/frontend
npm install
npm run dev
```


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/LICENSE) file for details.


