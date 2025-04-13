# Agent Nexus Protocol (ANP)

## 🌟 Overview

Agent Nexus Protocol (ANP) is a unique way for AI agent to collaborate with each other and develop relationships with each other. This enables them to effectively solve complex problems and tasks.

![image](https://github.com/user-attachments/assets/3190dda0-6c6f-41b1-ae0a-c9b33d82ad2a)


## 🚀 Features

- **Standardized Collaboration Protocol**: We've created an interface for AI agents to collaborate with each other, making it possible for different types of agents to work together seamlessly. This shared interface allows agents to exchange information, requests, and results in a structured way that any agent in the network can understand.

- **Intelligent Routing**: Our system acts like a smart traffic controller, figuring out which agent is best suited for each part of a complex task. When you ask a question, the router analyzes what you need and sends your request to the agent with the right expertise - whether that's researching information, drafting emails, or analyzing data.

- **Chain of Thought Sharing**: Instead of just sharing final answers, our agents share their thinking process along the way. This transparency means other agents can see not just what conclusion was reached, but how and why - making collaboration much more effective and allowing agents to build on each other's reasoning.


## Sponsors


##  Lilypad

We integrated Lilypad's powerful APIs to implement a major componant - Task Router

- Built a **task router** that analyzes what users are asking for and sends them to the right specialized agent
- Added **web search capabilities** so our agents can find up-to-date information when answering questions
- Created a system where different models work together on complex tasks, with each handling what they're best at

Check out our implementation in [task-router/route.ts](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/frontend/src/app/api/task-router/route.ts)!

## Akave

Akave's decentralized storage powers our secure agent marketplace:

- Implemented a **storage tool** that lets agents securely store and retrieve data
- Built an **agent marketplace** where users can browse, select, and "stake" on different specialized agents

See how we did it in [akave-storage.ts](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/frontend/src/features/agents/leadgen/akave-storage.ts)!

## Storacha

We used Storacha to enable true agent collaboration:

- Built a system where agents can **store their thinking process** and share it with other agents
- Created tools for agents to **learn from each other's work** and build on previous insights
- Implemented **transparent tracking** of all knowledge-sharing operations

Check out our collaboration system in [storacha-tool.ts](https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol/blob/master/frontend/src/features/agents/leadgen/storacha-tool.ts)!




## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol
cd ANP---Agent-Nexus-Protocol
npm install
npm run dev
```


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Details

This project was created during [Hackathon Name] by [Team Name]. Our goal was to create a standardized protocol for agent communication that could revolutionize how AI agents interact and collaborate.

### Team Members
- [Shubham Rasal](https://github.com/Shubham-Rasal)
- [Abhayjit Singh](https://github.com/abhayjit07)
- [Subhojit Karmakar](https://github.com/subhojit26)

