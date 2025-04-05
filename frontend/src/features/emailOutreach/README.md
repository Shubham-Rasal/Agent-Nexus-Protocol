# Email Outreach Agent

This module provides a simple way to analyze natural language text and automatically extract recipient information to send emails through Gmail.

## Features

- Natural language processing to extract recipient data
- Structured data extraction using Lilypad LLM API
- Automatic email generation with templates
- Gmail integration for sending emails
- Support for personalized and HTML emails

## Setup

### 1. Lilypad API Token

To use the Lilypad LLM API, you need to set up your API token:

1. Create or open the `.env.local` file in the project root
2. Add your Lilypad API token:
   ```
   LILYPAD_API_TOKEN=your_lilypad_api_token_here
   ```

### 2. Gmail Integration

The email outreach agent requires Gmail authentication to send emails:

1. Make sure the Google authentication is set up in your project
2. The user will need to connect their Gmail account when using the agent

## How It Works

### Structured Data Extraction

The email outreach agent uses structured outputs with the Lilypad LLM API to extract the following data from natural language input:

- Recipient's name
- Recipient's email
- Company name
- Position/title
- Email objective
- Additional content

The structured output ensures that the LLM always returns data in a consistent format that matches our JSON schema.

### JSON Schema

The agent uses the following JSON schema for structured outputs:

```json
{
  "type": "object",
  "properties": {
    "name": { 
      "type": "string", 
      "description": "The recipient's full name"
    },
    "email": { 
      "type": "string", 
      "description": "The recipient's email address"
    },
    "company": {
      "type": "string", 
      "description": "The company or organization the recipient works for, if mentioned"
    },
    "position": { 
      "type": "string", 
      "description": "The recipient's job title or position, if mentioned"
    },
    "objective": { 
      "type": "string", 
      "description": "The purpose of the email (e.g., 'schedule a demo', 'follow up')"
    },
    "content": { 
      "type": "string", 
      "description": "Any specific content that should be included in the email"
    }
  },
  "required": ["name", "email", "company", "position", "objective", "content"],
  "additionalProperties": false
}
```

### Example Usage

Users can provide natural language input like:

```
Send an email to John Smith (john@example.com) at Acme Corp. He's the CTO and I want to schedule a demo of our product next Tuesday.
```

The agent will extract the structured data:

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "company": "Acme Corp",
  "position": "CTO",
  "objective": "schedule a product demo",
  "content": "next Tuesday"
}
```

And generate an appropriate email based on the extracted information.

## Components

### 1. `AgentTester.tsx`

The main UI component for testing the email outreach agent. Provides:
- Input field for natural language text
- Extraction of structured data
- Email generation and sending
- Result display

### 2. `llm-client.ts`

Client library for interacting with the Lilypad LLM API:
- Handles API requests with structured outputs
- Provides type-safe responses
- Includes error handling

### 3. `api/lilypad/route.ts`

Backend API route that interfaces with the Lilypad LLM API:
- Processes requests from the front-end
- Formats prompts for structured outputs
- Handles JSON parsing and error responses

## Usage Tips

1. Be specific in your descriptions to get better extraction results
2. Include email addresses in a recognizable format (e.g., in parentheses or with an @ symbol)
3. Mention the company with "at [company]" for better extraction
4. Clearly state the objective (demo, follow-up, meeting, etc.)
5. If you want specific content in the email, mention it with "discuss: [content]" 