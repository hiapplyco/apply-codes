# Apply MCP Server

This MCP (Model Context Protocol) server provides AI assistants with structured access to the Apply codebase, enabling intelligent code navigation, analysis, and understanding.

## Features

### Resources
The server exposes key directories and files:
- **React Components** - All UI components in `src/components`
- **Edge Functions** - 35+ Supabase functions for AI operations
- **TypeScript Types** - Type definitions and interfaces
- **Pages & Hooks** - Application pages and custom React hooks
- **Documentation** - CLAUDE.md and other guides

### Tools
Six powerful tools for codebase interaction:

1. **search_codebase** - Search for patterns across files
2. **analyze_component** - Analyze React component structure
3. **find_edge_functions** - Discover Supabase edge functions
4. **analyze_ai_integrations** - Find AI/ML service usage
5. **get_project_stats** - Get codebase statistics
6. **find_api_endpoints** - Locate API calls and endpoints

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apply-codebase": {
      "command": "node",
      "args": ["/Users/jms/Development/apply-codes/mcp-server/dist/index.js"],
      "cwd": "/Users/jms/Development/apply-codes"
    }
  }
}
```

Note: Replace `/Users/jms/Development/apply-codes` with your actual project path.

### For VS Code

Coming soon - VS Code integration is in preview.

## Usage Examples

Once configured, you can ask Claude:

- "Search for all Gemini API integrations in the codebase"
- "Analyze the ProfileCard component structure"
- "Find all edge functions related to search"
- "Show me the project statistics"
- "Find all Supabase API calls"

## Development

To run in development mode:
```bash
npm run dev
```

To test the server:
```bash
npm test
```

## Tools Reference

### search_codebase
Search for patterns or text across the codebase.
- `pattern` (required): Text to search for
- `fileType`: Filter by extension (tsx, ts, css, json, md, all)
- `directory`: Specific directory to search

### analyze_component
Analyze a React component for dependencies and structure.
- `componentPath` (required): Path to component file

### find_edge_functions
Find and analyze Supabase edge functions.
- `functionName`: Specific function name (optional)
- `category`: Category filter (ai, search, data, auth, all)

### analyze_ai_integrations
Find AI/ML service integrations.
- `service`: Service to search for (gemini, openai, nymeria, all)

### get_project_stats
Get comprehensive codebase statistics.
- No parameters required

### find_api_endpoints
Locate API endpoints and calls.
- `type`: Endpoint type (supabase, external, all)

## Troubleshooting

1. **Server not appearing in Claude Desktop**
   - Ensure the config path is correct
   - Restart Claude Desktop
   - Check the server builds without errors

2. **Permission errors**
   - Make sure the built file is executable
   - Check file permissions in the project directory

3. **Tool execution errors**
   - Ensure `ripgrep` (rg) is installed for search functionality
   - Verify you're in the correct working directory

## Contributing

To extend this server:
1. Add new tools in `src/index.ts`
2. Update the tool schema and handler
3. Add documentation here
4. Test with `npm test`

## License

MIT