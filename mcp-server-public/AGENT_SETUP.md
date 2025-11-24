# apply-public MCP agent setup

Public recruitment helper tools (boolean search, JD drafting).

- **Path:** `/Users/jms/Development/apply-codes/mcp-server-public`
- **Command:** `node dist/index.js`
- **Transport:** stdio

## Claude Code / Claude Desktop snippet

```jsonc
{
  "mcpServers": {
    "apply-public": {
      "command": "node",
      "args": [
        "/Users/jms/Development/apply-codes/mcp-server-public/dist/index.js"
      ],
      "transport": "stdio",
      "env": {}
    }
  }
}
```

## Codex CLI/IDE snippet

```toml
[mcp_servers.apply-public]
command = "node"
args = ["/Users/jms/Development/apply-codes/mcp-server-public/dist/index.js"]

[mcp_servers.apply-public.env]
# No extra environment variables required
```

## Gemini CLI snippet

```jsonc
{
  "mcpServers": {
    "apply-public": {
      "command": "node",
      "args": [
        "/Users/jms/Development/apply-codes/mcp-server-public/dist/index.js"
      ],
      "transport": "stdio",
      "env": {},
      "trust": false
    }
  }
}
```
