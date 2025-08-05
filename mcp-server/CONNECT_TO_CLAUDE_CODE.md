# Connect Apply.codes MCP Server to Claude Code

## Step 1: Ensure Server is Built

```bash
cd /Users/jms/Development/apply-codes/mcp-server
npm run build
```

## Step 2: Add to Claude Code Configuration

Use the Claude Code CLI to add the MCP server:

```bash
claude mcp add /Users/jms/Development/apply-codes/mcp-server/claude-code-config.json
```

Or manually edit your `~/.claude.json` to include:

```json
{
  "mcpServers": {
    "apply-codes": {
      "command": "node",
      "args": ["/Users/jms/Development/apply-codes/mcp-server/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "timeout": 30000
    }
  }
}
```

## Step 3: Restart Claude Code

After configuration, restart Claude Code to load the updated MCP server with all 13 tools including:
- **boolean_search** (PRIMARY tool for searches)
- generate_boolean_query (deprecated)
- search_candidates (low-level)
- And 10 other recruitment tools

## Step 4: Test the Connection

In Claude Code, test with:

```
Use the boolean_search tool to find senior Python developers in San Francisco
```

## Available Tools (13 total)

### 🎯 Primary Search Tool
- **boolean_search** - Use this for ALL candidate searches (combines boolean generation + search)

### Sourcing Tools
- generate_boolean_query (⚠️ DEPRECATED - use boolean_search)
- search_candidates (⚠️ LOW-LEVEL - use boolean_search)
- analyze_job_requirements
- get_market_intelligence

### Document Processing
- parse_resume
- enhance_job_description
- compare_documents

### AI Orchestration
- execute_recruitment_workflow
- create_recruitment_plan
- get_orchestrator_status

### Interview Tools
- generate_interview_questions
- analyze_interview_feedback

## Important Notes

1. The server now includes system prompts that guide LLMs to use `boolean_search` as the primary tool
2. The `boolean_search` tool automatically generates boolean queries AND executes searches
3. Never use generate_boolean_query + search_candidates separately
4. The server has built-in prompts accessible via:
   - `recruitment-search-guide`: Full usage guidelines
   - `tool-selection-help`: Query-specific guidance

## Troubleshooting

If you see only 12 tools instead of 13:
1. Rebuild the server: `npm run build`
2. Check for build errors
3. Restart Claude Code
4. Verify the server.js includes the boolean_search tool import