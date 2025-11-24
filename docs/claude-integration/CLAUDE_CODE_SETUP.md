# Claude Code MCP Configuration for Apply.codes

## Quick Setup

### 1. Add to Claude Desktop Configuration

Add this to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "apply-codes": {
      "command": "node",
      "args": [
        "/Users/jms/Development/apply-codes/mcp-server/dist/server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

### 3. Verify Connection

In Claude, you should see "apply-codes" in your available MCP servers. Test with:

```
Use the boolean_search tool to find senior React developers in San Francisco
```

## Available Tools

### 🎯 Primary Search Tool
- **boolean_search** - Use this for ALL candidate searches

### 📄 Document Processing
- **parse_resume** - Extract structured data from resumes
- **enhance_job_description** - Improve job postings
- **compare_documents** - Match resumes to job requirements

### 🤖 AI Orchestration
- **execute_recruitment_workflow** - Run complete recruitment workflows
- **create_recruitment_plan** - Generate strategic plans
- **get_orchestrator_status** - Check system status

### 💼 Interview Tools
- **generate_interview_questions** - Create custom interview questions
- **analyze_interview_feedback** - Analyze interview responses

### 📊 Market Intelligence
- **get_market_intelligence** - Get salary and market insights
- **analyze_job_requirements** - Extract requirements from job descriptions

## Usage Examples

### Find Candidates
```
Use boolean_search to find senior Python developers with Django experience in Austin
```

### Parse Resume
```
Use parse_resume to extract information from the resume at /path/to/resume.pdf
```

### Generate Interview Questions
```
Use generate_interview_questions for a senior backend engineer role focusing on Python and microservices
```

## Important Notes

1. **Always use boolean_search for searches** - Never use generate_boolean_query + search_candidates separately
2. **Include location when searching** - Even "remote" is valuable
3. **Check credentials** - Ensure Google CSE API keys are configured in .env
4. **Default platform is LinkedIn** - Unless specified otherwise

## Troubleshooting

### Server Not Found
- Ensure the path in config is correct
- Check that the server is built: `cd mcp-server && npm run build`
- Verify Node.js is installed

### Search Not Working
- Check .env file has GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID
- Ensure credentials are valid
- Test with: `node test-boolean-direct.js`

### Tools Not Available
- Restart Claude Desktop after config changes
- Check server logs for errors
- Verify all dependencies installed: `npm install`

## Environment Variables

The server reads from `/Users/jms/Development/apply-codes/.env`:

```env
GOOGLE_CSE_API_KEY=your_key_here
GOOGLE_CSE_ID=your_search_engine_id
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Support

- Server logs: Check terminal output when running server
- Test tools: `node test-boolean-direct.js`
- List tools: Look for "apply-codes" in Claude's MCP servers