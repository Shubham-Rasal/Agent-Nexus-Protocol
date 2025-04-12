## Task routing

Basic routing is currently present in the project, but with mock responses. It has to be actually implemented as follows -

- user sends a query in the chat
- the query is sent to the task router
- the task router break it down into subtasks
- the sub tasks are then assigned to agents and the subtask is delegated to each agent
- the agents collaboration with each other and can go back and forth till all the sub tasks are solved and then combine them into a single final answer.
- The agents available are - lead-qualifier, email outreach agent, meeting scheduler, data analyser, research assistant. Each of the agents have appropriate tools and LLMs inside them.
- The agent should be able to work asychornously and get back when the task is done.

A sample query could be - "Find some info about Shubham Rasal's Github profile and send him a mail at bluequbits@gmail.com with relevant details and ask him when he would be free to book a call for an interview and book the call."

This query is sent to the task router. It should ideally break it down into the following tasks 

- Find info about Shubham Rasal - research agent
- send him a mail with the output of research agent at email id to ask if free - email outreach agent
- take details from the mail reply  and book a meet - meeting scheduler