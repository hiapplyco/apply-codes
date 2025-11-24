# MCP Server with Supabase Secrets Management

This guide explains how to deploy the Apply.codes MCP Server with secure secrets management using Supabase.

## Overview

MCP (Model Context Protocol) servers run locally on your machine and provide tools to Claude Desktop. Since they run locally, we use Supabase Edge Functions to securely manage API keys and secrets.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Claude Desktop  │────▶│  MCP Server  │────▶│ Google CSE API  │
└─────────────────┘     └──────┬───────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Supabase   │
                        │ Edge Function│
                        │  (Secrets)   │
                        └──────────────┘
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account and project
- Claude Desktop installed

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/apply-codes
cd apply-codes
```

### 3. Deploy Supabase Edge Function

1. Navigate to your Supabase project dashboard
2. Go to **Edge Functions** section
3. Create a new function called `get-mcp-secrets`
4. Copy the contents of `supabase/functions/get-mcp-secrets/index.ts`
5. Set the following environment variables in Supabase:
   - `GOOGLE_CSE_API_KEY` - Your Google Custom Search API key
   - `GOOGLE_CSE_ID` - Your Custom Search Engine ID
   - `PERPLEXITY_API_KEY` - (Optional) Perplexity API key
   - `OPENAI_API_KEY` - (Optional) OpenAI API key
   - `ANTHROPIC_API_KEY` - (Optional) Anthropic API key

### 4. Run Setup Script

The setup script will:
- Fetch secrets from Supabase
- Create local .env file
- Build the MCP server
- Generate Claude Desktop configuration

```bash
cd apply-codes
node scripts/setup-mcp.js
```

You'll be prompted for:
- Supabase URL (from project settings)
- Supabase Anon Key (from project settings)
- Supabase Service Key (optional, for enhanced security)

### 5. Configure Claude Desktop

Add the generated configuration to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apply-recruitment": {
      "command": "node",
      "args": ["/absolute/path/to/apply-codes/mcp-server/dist/server.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### 6. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## Security Features

### 1. Secrets Never in Git
- API keys are stored in Supabase, not in your repository
- Only Supabase credentials are in local .env (never commit this)

### 2. Encrypted Local Cache
- Secrets are cached locally with AES-256 encryption
- Cache expires after 1 hour (configurable)
- Machine-specific encryption keys

### 3. Authentication
- Edge Function requires valid Supabase JWT or API key
- Service key provides enhanced security

### 4. Automatic Rotation
- Update secrets in Supabase without code changes
- MCP server fetches fresh secrets on cache expiry

## Manual Setup (Without Script)

If you prefer manual setup:

1. Create `.env` file in `mcp-server/`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # Optional
```

2. Install dependencies:
```bash
cd mcp-server
npm install
```

3. Build the server:
```bash
npm run build
```

4. Add to Claude Desktop config (see step 5 above)

## Troubleshooting

### Secrets not loading
1. Check Supabase Edge Function logs
2. Verify environment variables are set in Supabase
3. Ensure correct Supabase credentials in .env

### MCP server not appearing in Claude
1. Verify correct path in claude_desktop_config.json
2. Check Claude Desktop logs for errors
3. Ensure MCP server builds successfully

### Cache issues
```bash
# Clear secrets cache
rm mcp-server/.secrets-cache
```

## Development Mode

For local development without Supabase:

1. Copy `.env.example` to `.env`
2. Add API keys directly to `.env`
3. Comment out Supabase URL/keys
4. Secrets manager will fall back to environment variables

## API Keys Required

### Google Custom Search Engine
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Custom Search API
4. Create credentials (API Key)
5. Create Custom Search Engine at [cse.google.com](https://cse.google.com)

### Other APIs (Optional)
- **Perplexity**: Get from [perplexity.ai/api](https://perplexity.ai/api)
- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com)
- **Anthropic**: Get from [console.anthropic.com](https://console.anthropic.com)

## Best Practices

1. **Never commit .env files** - Use .gitignore
2. **Rotate API keys regularly** - Update in Supabase
3. **Use service keys for production** - Enhanced security
4. **Monitor usage** - Check API quotas regularly
5. **Keep cache TTL reasonable** - Balance security vs performance

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/apply-codes/issues)
- Documentation: See `/docs` folder
- MCP Protocol: [modelcontextprotocol.io](https://modelcontextprotocol.io)