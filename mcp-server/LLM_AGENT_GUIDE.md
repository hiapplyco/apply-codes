# LLM Agent Guide for Apply.codes MCP Server

## Quick Start - Tool Selection

### 🎯 For ANY candidate search request:
```
ALWAYS use: boolean_search
NEVER use: generate_boolean_query + search_candidates (separately)
```

## Tool Usage Patterns

### ✅ CORRECT Pattern - Single Tool Call
```yaml
User: "Find senior React developers with TypeScript in New York"
Agent: 
  Tool: boolean_search
  Arguments:
    customInstructions: "senior React developers with TypeScript"
    location: "New York"
    platforms: ["linkedin"]
    maxResults: 20
```

### ❌ INCORRECT Pattern - Multiple Tool Calls
```yaml
User: "Find senior React developers with TypeScript in New York"
Agent:
  Step 1 - Tool: generate_boolean_query  # WRONG!
  Step 2 - Tool: search_candidates       # WRONG!
```

## Semantic Input Processing

When receiving natural language requests, extract:

| Element | Examples | Field Mapping |
|---------|----------|---------------|
| **Skills** | Python, AWS, React, Kubernetes | → customInstructions |
| **Titles** | Developer, Architect, Manager | → customInstructions |
| **Level** | Senior, Lead, Principal | → customInstructions |
| **Location** | "New York", "Bay Area", "remote" | → location |
| **Quantity** | "top 10", "5 candidates" | → maxResults |

### Examples:

1. **"I need 5 senior Python developers with Django experience in Austin"**
   ```json
   {
     "customInstructions": "senior Python developers with Django experience",
     "location": "Austin",
     "maxResults": 5
   }
   ```

2. **"Find cloud architects with AWS and Terraform skills"**
   ```json
   {
     "customInstructions": "cloud architects with AWS and Terraform skills",
     "maxResults": 20
   }
   ```

3. **"Search for remote React developers"**
   ```json
   {
     "customInstructions": "React developers",
     "location": "remote",
     "maxResults": 20
   }
   ```

## Tool Priority Matrix

| Task | Primary Tool | Secondary Tools | Never Use |
|------|--------------|-----------------|-----------|
| Find candidates | `boolean_search` | - | `generate_boolean_query`, `search_candidates` |
| Analyze job posting | `analyze_job_requirements` | `enhance_job_description` | - |
| Process resume | `parse_resume` | `compare_documents` | - |
| Market research | `get_market_intelligence` | - | - |
| Interview prep | `generate_interview_questions` | `analyze_interview_feedback` | - |

## System Prompts

The MCP server provides two system prompts:

1. **recruitment-search-guide**: Complete guidelines for all tools
2. **tool-selection-help**: Query-specific guidance

Use these prompts to understand the best tool for each situation.

## Best Practices

1. **Always use boolean_search for searches** - It's optimized and tested
2. **Include location when mentioned** - Even "remote" is valuable
3. **Be specific in customInstructions** - More detail = better matches
4. **Default to LinkedIn** - Unless user specifies otherwise
5. **Use reasonable limits** - 10-20 results for initial searches

## Common Phrases → Tool Mapping

| User Says | Use Tool |
|-----------|----------|
| "Find...", "Search for...", "Look for..." | `boolean_search` |
| "What's the market rate..." | `get_market_intelligence` |
| "Parse this resume..." | `parse_resume` |
| "Analyze this job..." | `analyze_job_requirements` |
| "Generate interview questions..." | `generate_interview_questions` |

## Remember

The `boolean_search` tool is the PRIMARY interface for ALL candidate discovery. It automatically handles the complete two-step process (query generation → search execution) that the web app uses successfully.