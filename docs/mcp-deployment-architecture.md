# MCP Server Deployment Architecture

## Overview

This document explains how the Apply.codes MCP Server integrates with Supabase for secure secrets management while running locally on developer machines.

## Key Concepts

### MCP Servers Run Locally
- MCP servers are **local processes** that Claude Desktop connects to
- They run on the **same machine** as Claude Desktop
- Cannot be hosted remotely (no cloud deployment)
- Communication happens via stdio (standard input/output)

### Supabase for Secrets Management
- API keys are stored securely in Supabase
- Edge Functions provide authenticated access to secrets
- Local caching reduces API calls
- Secrets never appear in Git repositories

## Architecture Diagram

```
┌─────────────────────────── Local Machine ───────────────────────────┐
│                                                                      │
│  ┌─────────────────┐         ┌──────────────────┐                  │
│  │ Claude Desktop  │ stdio   │   MCP Server     │                  │
│  │                 │◄──────►│                  │                  │
│  │  - User queries │         │ - Runs locally   │                  │
│  │  - Tool calls   │         │ - TypeScript/Node│                  │
│  └─────────────────┘         │ - Manages tools  │                  │
│                              └────────┬─────────┘                  │
│                                       │                             │
│                              ┌────────▼─────────┐                  │
│                              │ Secrets Manager  │                  │
│                              │                  │                  │
│                              │ - Local cache    │                  │
│                              │ - Encrypted      │                  │
│                              │ - TTL: 1 hour    │                  │
│                              └────────┬─────────┘                  │
│                                       │                             │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │ HTTPS
                                        │
                              ┌─────────▼──────────┐
                              │     Supabase       │
                              │                    │
                              │ ┌────────────────┐ │
                              │ │ Edge Function  │ │
                              │ │                │ │
                              │ │ - Auth check   │ │
                              │ │ - Return keys  │ │
                              │ └────────────────┘ │
                              │                    │
                              │ ┌────────────────┐ │
                              │ │ Env Variables  │ │
                              │ │                │ │
                              │ │ - API Keys     │ │
                              │ │ - Credentials  │ │
                              │ └────────────────┘ │
                              └────────────────────┘
```

## Data Flow

### 1. Initial Setup
```
Developer → setup-mcp.js → Supabase → Fetch Secrets → Create .env → Build MCP
```

### 2. Runtime Operation
```
Claude Desktop → MCP Server → Secrets Manager → Cache Hit? 
                                                    ├─ Yes → Return Cached
                                                    └─ No → Fetch from Supabase
```

### 3. Secret Rotation
```
Update in Supabase → Wait for Cache Expiry → MCP Fetches New Secrets → Auto-update
```

## Security Layers

### 1. Authentication
- Supabase JWT tokens or API keys required
- Edge Function validates all requests
- Service keys provide enhanced security

### 2. Encryption
- Local cache encrypted with AES-256
- Machine-specific encryption keys
- Secrets never stored in plaintext

### 3. Access Control
- Secrets only accessible to authenticated requests
- No public access to Edge Functions
- Rate limiting on API endpoints

### 4. Git Security
- .gitignore prevents committing secrets
- Only example files in repository
- Supabase credentials in local .env only

## Benefits

### For Development
- Easy local setup with one script
- No manual API key management
- Consistent across team members

### For Security
- Centralized secret management
- Easy key rotation
- No secrets in version control
- Audit trail in Supabase

### For Operations
- Works offline (cached secrets)
- Automatic updates on rotation
- Minimal configuration required
- Cross-platform compatibility

## Common Patterns

### Team Onboarding
1. New developer clones repository
2. Runs `node scripts/setup-mcp.js`
3. Enters Supabase credentials
4. MCP server ready to use

### API Key Rotation
1. Update key in Supabase dashboard
2. Wait for cache expiry (1 hour)
3. All MCP instances auto-update
4. No code changes required

### Multi-Environment Setup
```
Production Supabase → Production Secrets → Production MCP
Staging Supabase → Staging Secrets → Staging MCP
Local Dev → Local .env → Development MCP
```

## Troubleshooting

### Connection Issues
```bash
# Check Supabase connection
curl https://your-project.supabase.co/functions/v1/get-mcp-secrets \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Cache Problems
```bash
# Clear local cache
rm mcp-server/.secrets-cache

# Force refresh
SECRETS_CACHE_TTL=0 npm run dev
```

### Debug Mode
```bash
# Enable verbose logging
LOG_LEVEL=debug npm run dev

# Check secrets loading
DEBUG=secrets:* npm run dev
```

## Best Practices

1. **Never commit .env files** - Always use .gitignore
2. **Use service keys in production** - Better security than anon keys
3. **Monitor API usage** - Check Supabase dashboard regularly
4. **Rotate keys quarterly** - Security best practice
5. **Test locally first** - Use .env.example as template

## Future Enhancements

- [ ] Multi-region secret caching
- [ ] Webhook-based cache invalidation
- [ ] Secret versioning and rollback
- [ ] Enhanced audit logging
- [ ] Team-based access control