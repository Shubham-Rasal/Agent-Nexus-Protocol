
# Grant Proposal: `ANP: Agent Nexus Protocol Improvements and Continuation`

**Project Name:** **ANP - Agent Nexus Protocol**

**Proposal Category:** Other

**Individual or Entity Name:** Shubham Rasal

**Proposer:**  `Shubham Rasal`

**Project Repo(s)** : https://github.com/Shubham-Rasal/ANP---Agent-Nexus-Protocol

**Filecoin ecosystem affiliations:** NA

**(Optional) Technical Sponsor:** rk-rishikesh

**Do you agree to open-source all work you do on behalf of this RFP under the MIT/Apache-2 dual-license?:** Yes


### 1. What is your project and what problem does it solve? (max 100 words)

Agent Nexus Protocol (ANP) is a unique way for AI agents to collaborate with each other and develop relationships over time. This enables them to effectively solve complex problems and tasks and learn from historical performance.

All communication, reputation, and outputs of AI agents are stored as encrypted and access-controlled artifacts on Filecoin for verifiability, security, and distributed intelligence. 

Presentation Video - [AI Blueprints Finale]( https://youtu.be/UBsGp5VtTxc?si=nZdgJ0vmU9sPWh8N&t=131)
PPT - [Canva Link  ](https://www.canva.com/design/DAGmGtq001c/nf1rrhkmi6lS1c4_1vw8uw/view?utm_content=DAGmGtq001c&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6944613ea6)
Demo Video - https://youtu.be/zU4trhgacHs?si=OcZRSlNyi7qmIyRg

### 2. How is Filecoin used in this project? 
## Project Outline

The system has the following core parts - 

- Core Protocol (ANP)
- Agent Creation and Management
- Agent Reputation and Artifact Storage Sync Engine
- Local Chat Interface

## How will the protocol work?

The protocol is called Nexus because it aims to create a network of agents that interact with each other and remember history.

After every interaction of the user with our agents, the protocol will update the reputation of the agents involved. 

Whenever a user runs an instance of the chat client locally, the agents will be available for selection from the agent library, which will include the local custom built agents, and the external one. 

NOTE: The external agents are just a JSON template of the agent structure and tools it has access to. 

Once these agents (local and external) agents are setup with their config, the chat interface can be used to ask them to do stuff. The intelligent router, which itself is a specialised agent, will assign tasks to the appropriate agent.

## Agent creation

The agent creation process should be user-friendly for greater adoption. So, the plan is to provide a no-code UI editor for building an agent.

## Anatomy of an agent in ANP

The agent will be the most basic unit in the protocol.

Each agent will consist of the following 

1. Name - To identify the agent
2. Description (short) - one-liner explanation
3. System Prompt  - customisable to fine-tune agent performance
4. Set of tools - provided as a dropdown of MCP servers
5. Tags - keywords or use cases in which this agent performs best
6. History of performance - resume of past work with other agents
7. LLM provider - choose a specific LLM for this agent

After creation, the agent metadata is published to the smart contract from where is can be access by anyone.

## Tool support 

The tool support will be provided through MCP (Model Context Protocol) since it is standardised and provides access to a wide variety of tools and services.

## How will reputation work?

Each agent will be evaluated by the task router and the user.

1. User ratings - This will be used to signify the usefulness of the agent in the users task.
2. Task router ratings - These ratings are more nuanced as the task router will take in the following factors under consideration and provide updates on various parameters
	- How did the agent perform with respect to other agents
	- What tags does it have
	- Update the resume of an agent with new experience

Overtime, relationships between various agents will organically develop, resumes of each agent will mature and the overall system will become more usable. 

The agents will run locally, but the reputation after working properly will be published back to the smart contract. 

## Storage sync engine

The network will be present as a registry smart contract as described earlier. But intermediate data, like inputs, outputs, and reasoning, needs to be stored somewhere.

## The concept of artifacts

An artifact is any intermediate result or data that needs to be stored in Filecoin for future agents to process. 

This can include the following - 

    - Input
    - Output
    - Chain of Thought
    - Code Artifacts
    - Execution Artifacts
    - Model Artifacts
    - Training Data
    - Metadata
    - Annotations

Apart from this data that will encrypted and stored in filecoin, we plan to implement a verifiable resume of sort for each agent that will act proof of work for reliabiity and trust. 

## Subgraph on FEVM

We will be deploying the smart contract on FEVM with a subgraph to track the activity of the usage of the agent. This will help us see which agents have gained more popularity, used storage deals efficiently, etc.

## Chat Interface

During the hackathon, we were able to build a novel UX for multi agent interaction with a simple chat (find video here ). This made use realise that a simple to use interface is essential.
We plan to keep the core UX same with improvements around it's interactions with external api, especially MCP servers.


## UX of chat

The user launches a new thread and starts with a query. The query is then processed by the task router and broken down into various smaller tasks.

The task router checks from available agents and assigns tasks to the appropriate ones. 

To better understand the chat interface, please take a look at our demo video - https://www.youtube.com/watch?v=zU4trhgacHs.
  
### 3. How will you improve your project with this grant? What steps will you take to meet this objective?

<!-- Using the table below, provide a clear and concise description of the planned next step(s) or improvements for which you are seeking grant support -->
  
| Number | Grant Deliverable                                          | Briefly describe how you will meet deliverable objectives                                                                                                                   | Timeframe (within 3 months) |     |
| :----- | :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- | --- |
| 1.     | Local Agent Creation Interface                             | Building agent profiles with LLM, tools, and prompt customization.                                                                                                          | 2 weeks                     |     |
| 2.     | Integrate the MCP into the interface                       | Integrate the MCP (Model Context Protocol) to provide agents with access to standardized tools and services.                                                                | 2 weeks                     |     |
| 3.     | FEVM Smart Contract + Subgraph and Artifact Storage Engine | Deploy the agent registry smart contract to FEVM and set up a subgraph to monitor contract activity. Implement a sync engine                                                | 4 weeks                     |     |
| 4.     | Reputation                                                 | Implement the logic for collecting task ratings from users and the intelligent task router. Store agent resumes and update tags/metrics based on interactions and outcomes. | 3 weeks                     |     |

<!--5	Artifact Storage Engine	Implement artifact creation and encrypted Filecoin storage engine for storing interaction outputs.	Month 2 -->

Apart from these core milestones, there are numerous design issues and parts of the project that needs to be implemented. We intend to convey these in our monthly reports.

### 4. What is the total amount of this grant request? 
 $7k

### 5. Adoption, Reach, and Growth Strategies

#### Use cases we are targeting

Let's think pragmatically, where would someone use a multi-agent approach like ANP:

Based on my daily actions, these are the workflows that I would like multiple agents to solve

- Tech news curation from all major outlets into a concise newsletter or email
- Lead Generation for business and automated research for personalisation
- Boring compliance checking of a document
- Managing emails for support of queries for projects and products developed by us
#### Audience

The audience we are trying to target is technical founders and business owners who want to automate their workflows or want a verifiable and robust way of interacting with AI agents.

This audience is quite large according our estimates. We have been active in various communities where ai agents are discussed as r/ai_agents, discord servers, etc. 

Apart from this, we ourselves fit this use case and would really be happy if such a solution existed. 

Since this protocol needs two types of users - agent creators, and agent users, we need to incentivise the creators from the beginning itself. 

The following marketing channels will be used to onboard our first 100 users 

- Reddit (niche subreddits with high AI literacy)
- X
- Discord servers
### 6. If accepted, do you agree to share monthly project updates in this GitHub issue until the project described here is complete?
<!-- Report content may include progress or results of your grant-funded work, any Filecoin technical or usage guidance requests, and a description of your experience building on Filecoin, including any challenges or shortcomings encountered. -->

Yes, we agree to submit a monthly project report with the following aspects covered in it 

- What the plan was
- How much we have achieved
- Roadblocks that the Filcoin team can solve
- Feedback on FEVM/FVM and other metrics that we might encounter during development

### 7. Does your proposal comply with our Community Code of Conduct?
Yes
### 8. Links and submissions
* If your project began at an event or hackathon, have you submitted it for relevant prizes in the ecosystem? If so, please share the event name and a link to your hackathon submission(s) 
  
### Additional questions:
| Name              | Email                         | GitHub Account                                    | Role                                            |
| ----------------- | ----------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Shubham Rasal     | shubhamrasal0070112@gmail.com | [Shubham-Rasal](https://github.com/Shubham-Rasal) | Core lead, responsible for the artifacts engine |
| Abhayjit Singh    | singhabhayjit07@gmail.com<br> | [abhayjit07](https://github.com/abhayjit07)       | Agent smart contract developer                  |
| Subhojit Karmakar | ksubhojit20@gmail.com         | [subhojit26](https://github.com/subhojit26)       | Local chat interface developer                  |


* How did you learn about this grant type program - AI Blueprint Hackathon 2025
