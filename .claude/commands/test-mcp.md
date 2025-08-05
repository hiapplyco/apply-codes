# Test MCP Command

Test MCP (Model Context Protocol) server tools and connections.

## Usage
```
/project:test-mcp [tool-name]
```

## Available Tests

### Connection Test
```bash
# Verify MCP server is running
node mcp-server/test-client.js
```

### Tool Tests

1. **Boolean Search**
   ```bash
   node mcp-server/test-boolean-direct.js
   ```
   Tests AI-powered boolean query generation

2. **Resume Parser**
   ```bash
   node mcp-server/test-tools.js parse_resume
   ```
   Tests document parsing capabilities

3. **Job Analysis**
   ```bash
   node mcp-server/test-tools.js analyze_job_requirements
   ```
   Tests job description extraction

4. **Document Comparison**
   ```bash
   node mcp-server/test-tools.js compare_documents
   ```
   Tests resume-to-job matching

## Full Workflow Test

Run complete recruitment workflow:
```bash
node mcp-server/test-real-search.js
```

This tests:
- Job requirement analysis
- Boolean query generation
- Candidate search
- Profile enrichment
- Matching and ranking

## Debugging

### Check Server Status
```bash
cd mcp-server
npm run dev -- --debug
```

### View Server Logs
```bash
tail -f mcp-server/logs/mcp-server.log
```

### Test Individual Endpoints
```bash
curl http://localhost:3000/health
```

## Configuration Verification

### Claude Desktop Config
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Environment Variables
```bash
# Check required vars
grep -E "GEMINI_API_KEY|NYMERIA_API_KEY" .env
```

## Common Issues

1. **Connection Refused**
   - Ensure MCP server is running
   - Check port 3000 is available

2. **Tool Not Found**
   - Rebuild MCP server: `npm run build`
   - Restart Claude Desktop

3. **API Key Errors**
   - Verify environment variables
   - Check Supabase secrets

## Expected Output
```
✅ MCP Server connected
✅ All tools registered
✅ API keys validated
✅ Database connection active
```