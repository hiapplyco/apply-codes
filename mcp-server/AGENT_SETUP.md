# apply-internal MCP agent setup

Full Apply.codes recruitment toolchain (Supabase + Google integrations).

- **Path:** `/Users/jms/Development/apply-codes/mcp-server`
- **Command:** `node dist/server.js`
- **Transport:** stdio

## Claude Code / Claude Desktop snippet

```jsonc
{
  "mcpServers": {
    "apply-internal": {
      "command": "node",
      "args": [
        "/Users/jms/Development/apply-codes/mcp-server/dist/server.js"
      ],
      "transport": "stdio",
      "env": {
        "See": "See_VALUE"
      }
    }
  }
}
```

## Codex CLI/IDE snippet

```toml
[mcp_servers.apply-internal]
command = "node"
args = ["/Users/jms/Development/apply-codes/mcp-server/dist/server.js"]

[mcp_servers.apply-internal.env]
See = "SEE_VALUE"
```

## Gemini CLI snippet

```jsonc
{
  "mcpServers": {
    "apply-internal": {
      "command": "node",
      "args": [
        "/Users/jms/Development/apply-codes/mcp-server/dist/server.js"
      ],
      "transport": "stdio",
      "env": {
        "See": "See_VALUE"
      },
      "trust": false
    }
  }
}
```
