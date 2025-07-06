

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

Agent Nexus Protocol (ANP) is a unique way for AI agents to collaborate with each other and develop relationships with each other. This enables them to effectively solve complex problems and tasks.

![image](https://github.com/user-attachments/assets/17ca4ac7-4f6a-4de6-8e56-192ef9656391)

## 🚀 Features

- **Standardized Collaboration Protocol**: We've created an interface for AI agents to collaborate with each other, making it possible for different types of agents to work together seamlessly. This shared interface allows agents to exchange information, requests, and results in a structured way that any agent in the network can understand.

- **Intelligent Routing**: Our system acts like a smart traffic controller, figuring out which agent is best suited for each part of a complex task. When you ask a question, the router analyzes what you need and sends your request to the agent with the right expertise - whether that's researching information, drafting emails, or analyzing data.

- **Chain of Thought Sharing**: Instead of just sharing final answers, our agents share their thinking process along the way. This transparency means other agents can see not just what conclusion was reached, but how and why - making collaboration much more effective and allowing agents to build on each other's reasoning.

![Screenshot from 2025-04-13 21-24-49](https://github.com/user-attachments/assets/7951944b-d180-4242-9847-4d8a14ccbc00)
![Screenshot from 2025-04-13 21-24-53](https://github.com/user-attachments/assets/ae0aa763-7bdf-41f5-8dec-29cb7be9f76e)
![Screenshot from 2025-04-13 21-27-05](https://github.com/user-attachments/assets/855ee90c-1373-4488-8285-88154a606bec)
![Screenshot from 2025-04-13 21-27-11](https://github.com/user-attachments/assets/ae584d0d-9ab9-4194-a725-3d231bd0b8ee)

![Screenshot from 2025-04-13 21-27-21](https://github.com/user-attachments/assets/3e18a70d-2b47-4145-bf2a-15be67b11f00)

![Screenshot from 2025-04-13 21-27-33](https://github.com/user-attachments/assets/47cb09c8-78c0-4865-94b7-5d8715b875c7)


![Screenshot from 2025-04-13 21-27-45](https://github.com/user-attachments/assets/05746197-ff02-4a5c-a0e7-ed61d4f005de)

![Screenshot from 2025-04-13 21-33-18](https://github.com/user-attachments/assets/cb67a732-7702-4009-8009-3674fce92d44)


## Sponsors


##  Lilypad

We integrated Lilypad's powerful APIs to implement a major componant - Task Router

- Built a **task router** that analyzes what users are asking for and sends them to the right specialized agent
- Added **web search capabilities** so our agents can find up-to-date information when answering questions
- Created a system where different models work together on complex tasks, with each handling what they're best at

Check out our implementation in [task-router/route.ts](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/frontend/src/app/api/task-router/route.ts)!

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol
cd ANP---Agent-Nexus-Protocol/frontend
npm install
npm run dev
```


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/LICENSE) file for details.


