
# Plan for continuation

Simplify the tech stack and only keep a single storage provider

Replace the LLM provider with Open router and vercel ai sdk 


Add a way to self host the complete platform in-house with their own apis

Add a way to incorporate MCP into the tool directory for streamlining the process of adding new tools

Implement agent creation with option to customise system prompt, tools, relationships through a graph




### ai blueprints



## How will the protocol work?

The agents built as described in the previous step are published to a registry smart contract that maintains the reputation of each agent. 

Whenever a user runs an instance of the chat client locally, the agents will be available for selection from the agent library, which will include the local custom built agents, and the external one. 

NOTE: the external agents are just a json template of the agent structure and tools it has access to. 

Once these agents (local and external) agents are setup with their config, the chat interface can be used to ask them to do stuff. The intelligent router, which itself is a specialised agent, will assign tasks to the appropriate agent.

## Agent creation

The agent creation process should be user friendly for greater adoption. So, the plan is to provide a no code UI editor for building agent.

## Anatomy of an agent in ANP

The agent will be most basic unit in the protocol.

Each agent will consist of the following 

1. Name - To identify the agent
2. Description (short) - one liner explaination
3. System Prompt  - customisable to fine tune agent performance
4. Set of tools - provided as a dropdown of MCP servers
5. Tags - keywords or usecases in which this agent performs best
6. History of performance - resume of past work with other agents
7. LLM provider - choose a specific LLM for this agent

After creation, the agent metadata is published to the smart contract from where is can be access by anyone.

## Tool support 

The tool support will be provided through MCP (Model Context Protocol) since it is standardised and provides access to a wide variety of tools and services.


## How reputation will work?

Each agent will be evaluated by the task router and the user.

1. User ratings - This will be used to signify the usefulness of the agent in the users task.
2. Task router ratings - These ratings are more nuanced as the task router will take in the following factors under consideration and provide updates on various parameters
	- how did the agent perform with respect to other agents
	- what tags does it have
	- update the resume of agent with new exp

Overtime, relationships between various agents will organically develop, resumes of each agent will mature and the overall system will become more usable. 


The agents will run locally but the reputation after working properly would be published back to the smart contract. 


## Chat Interface

During the hackathon, we were able to build a novel UX for multi agent interaction with a simple chat (find video here ). This made use realise that a simple to use interface is essential.

## UX of chat

The user launches a new thread and starts will a query. The query is then processed by the task router and broken down into various smaller tasks.

Check out [here] what our protocol would be good at doing.

The task router check from available agents and assigns tasks to the appropriate ones. 



