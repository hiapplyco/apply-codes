# Tool-Aware Chat Assistant

A sophisticated AI chat assistant that analyzes user intent and dynamically calls appropriate edge functions to help with recruitment tasks.

## Features

- **Intent Analysis**: Uses Chain of Thought (CoT) prompting to understand user requests
- **Dynamic Tool Routing**: Automatically calls relevant edge functions based on intent
- **Persistent Storage**: Saves all interactions and results to Supabase
- **Context Awareness**: Maintains conversation history and session context
- **Error Handling**: Graceful fallbacks when tools fail

## Available Tools

1. **generate_boolean_search**: Create boolean search strings for finding candidates
2. **explain_boolean_search**: Explain what a boolean search string does
3. **enhance_job_description**: Improve and format job descriptions
4. **analyze_compensation**: Analyze salary data for roles
5. **enrich_profile**: Get additional information about candidates
6. **search_contacts**: Search for contact information

## Architecture

```
User Message
    ↓
Intent Analyzer (CoT)
    ↓
Tool Selection
    ↓
Tool Execution (Parallel)
    ↓
Response Generation
    ↓
Storage (agent_outputs)
```

## Usage

### Basic Request

```typescript
POST /functions/v1/chat-assistant
{
  "message": "Find senior React developers in San Francisco",
  "systemPrompt": "You are a helpful recruitment assistant",
  "history": [],
  "sessionId": 123,
  "userId": "user-uuid",
  "projectId": "project-uuid"
}
```

### Response Format

```typescript
{
  "response": "I'll help you find senior React developers...",
  "toolCalls": [
    {
      "tool": "generate_boolean_search",
      "parameters": {...},
      "result": {...}
    }
  ],
  "metadata": {
    "model": "gemini-2.5-flash",
    "timestamp": "2025-01-29T...",
    "intentAnalysis": {
      "intent": "find_candidates",
      "confidence": 0.95,
      "suggestedTools": ["generate_boolean_search"],
      "parameters": {...},
      "reasoning": "..."
    },
    "agentOutputId": 12345
  }
}
```

## Intent Analysis

The assistant uses a sophisticated CoT prompt to:

1. Understand what the user is asking for
2. Consider conversation context
3. Select appropriate tools
4. Extract necessary parameters
5. Assess confidence level

## Storage

All interactions are stored in the `agent_outputs` table with:

- Full intent analysis
- Tool calls and results
- Generated responses
- Session and project associations
- Timestamps and metadata

## Adding New Tools

To add a new tool:

1. Create the edge function
2. Register it in `tools.ts`:

```typescript
this.register({
  name: 'your_tool_name',
  description: 'What this tool does',
  execute: async (params) => {
    // Implementation
  }
});
```

3. The intent analyzer will automatically consider it for relevant requests

## Error Handling

- Tools that fail still return results with error information
- The assistant explains failures gracefully to users
- All errors are logged for debugging

## Performance Considerations

- Tools execute in parallel when multiple are needed
- Responses are generated while considering all tool results
- Database operations are non-blocking

## Security

- All requests require authentication
- RLS policies control data access
- API keys are securely managed
- Input validation on all parameters