# Apply.codes MCP Server

Full-featured MCP server that exposes Apply.codes recruitment automations
(Supabase orchestration, Google integrations, boolean search helpers, etc.).

- Run `npm install && npm run build` before wiring it into an agent.
- Copy the environment checklist from `docs/mcp-server/MCP_SUPABASE_SETUP.md`.
- Use `AGENT_SETUP.md` (auto-generated) for Claude, Codex, and Gemini snippets.

> Regenerate the snippets after any refactor via `node scripts/mcp/generate-agent-docs.mjs`
> from the repository root.
