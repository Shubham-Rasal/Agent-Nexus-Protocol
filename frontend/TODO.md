# Migration Plan: Lilypad API to OpenAI API

## Phase 1: Setup and Configuration
- [x] Add OpenAI API dependency to the project
- [x] Create OpenAI API client utility
- [x] Create environment variables for OpenAI API key
  - [x] Add OPENAI_API_KEY to .env.local
  - [x] Update environment variable documentation
  - [x] Add environment variable validation
- [x] Set up OpenAI API configuration file

## Phase 2: API Integration
- [x] Identify all Lilypad API endpoints currently in use:
  - Found in:
    - /frontend/src/lib/lilypad.ts (main API client)
    - /frontend/src/tools/csv-processor.ts (CSV processing)
    - /frontend/src/tools/search.ts (web search)
    - /frontend/src/app/api/task-router/route.ts (task routing)
    - /frontend/src/app/api/lilypad/route.ts (LLM service)
- [x] Map Lilypad API calls to equivalent OpenAI API endpoints:
  - [x] Replace text generation endpoints with GPT-3.5-turbo
  - [x] Replace chat completion endpoints with GPT-3.5-turbo
  - [x] Update web search functionality with Serper API
    - Note: Requires SERPER_API_KEY environment variable to be set
- [x] Create OpenAI API service layer
- [x] Implement error handling and rate limiting for OpenAI API

## Phase 3: Code Migration
- [x] Update API client imports throughout the codebase
  - [x] Replace Lilypad imports with OpenAI imports in task router
  - [x] Replace Lilypad imports with OpenAI imports in CSV processor
  - [x] Replace Lilypad imports with Serper API in web search
  - [x] Replace Lilypad imports with OpenAI imports in LLM service
- [x] Replace Lilypad API calls with OpenAI API calls:
  - [x] Migrate task router
  - [x] Migrate CSV processor tool
  - [x] Migrate web search tool
  - [x] Migrate LLM service
- [x] Update request/response handling for OpenAI format
- [x] Update type definitions and interfaces
