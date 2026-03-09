# CLAUDE.md — HiApply (Apply Codes)

Strictly follow the rules in ./AGENTS.md

## Project

AI recruitment platform fighting "Brain Waste" — underutilization of skilled veterans, immigrants, military spouses.

## Stack

React 18 + TypeScript + Next.js · Firebase (Auth, Firestore, Cloud Functions, Storage) · Gemini AI · MCP Server (apply-recruitment v2.0.0)

## Commands

```bash
npm run dev         # Next.js dev server
npm run build       # Production build
npm test            # Vitest
cd functions && node -e "require('./index')"  # Validate functions
cd mcp-server && npm run build                # Build MCP server
```

## Structure

```
src/components/   — UI (100+ components)
src/pages/        — Route pages
src/hooks/        — Custom hooks
src/lib/          — Services/utilities
functions/        — Firebase Cloud Functions (74 files)
functions/utils/  — Shared utilities (gemini, nymeria, enrichment-service, auth-cors, sendgrid)
functions/mcp-chat/ — MCP Chat orchestrator (Gemini function-calling + MCP tools)
mcp-server/       — MCP server (11 tools, 5 resources, 5 prompts)
```

## Shared Utilities (`functions/utils/`)

Lazy-init singletons following the `sendgrid.js` pattern. Import from `./utils/<name>`:

| File | Exports | Purpose |
|------|---------|---------|
| `gemini.js` | `getModel`, `getJsonModel`, `generateContent` | Gemini AI singleton (default: `gemini-3.1-pro-preview`) |
| `nymeria.js` | `enrichPerson`, `searchPerson` | Nymeria API client (30s timeout) |
| `enrichment-service.js` | `enrichContact` | Waterfall enrichment with Firestore cache |
| `auth-cors.js` | `corsHeaders`, `handlePreflight`, `verifyAuth`, `withAuth` | CORS + Firebase Auth for onRequest handlers |
| `sendgrid.js` | `getSendGrid` | SendGrid email client |
| `daily.js` | `DAILY_API_BASE`, `getDailyHeaders`, `generateMeetingToken`, `sanitizeRoomProperties`, `resolveDailyApiKey`, `resolvePipecatApiKey` | Daily.co API helpers, token generation, key resolution |

## onCall Migration

30+ functions migrated from `onRequest` to `onCall` (v2). Remaining `onRequest` functions use `auth-cors.js` for shared CORS/auth boilerplate. New functions should default to `onCall` unless SSE streaming is required.

## MCP Chat (`mcpChatStream`)

SSE-streaming `onRequest` function that bridges Gemini function-calling with MCP server tools.

**Backend:** `functions/mcp-chat-stream.js` → `functions/mcp-chat/` (orchestrator, sse-transport, tool-bundler, secrets-bridge, types)

**Frontend:** Feature-flagged via `NEXT_PUBLIC_ENABLE_MCP_CHAT=true`
- `src/types/mcp-chat.ts` — Stream event types, tool call types
- `src/lib/mcp-chat-service.ts` — SSE client, event parsing
- `src/hooks/useMCPChat.ts` — React hook (state, streaming, confirmation flow)
- `src/components/chat/EmbeddedChat.tsx` — MCP mode toggle integration
- `src/components/chat/ToolResultRenderer.tsx` — Tool result display
- `src/components/chat/tool-results/` — Specialized renderers

**Key behaviors:**
- High-impact tools (email, scheduling) require user confirmation before execution
- Max 5 tool calls per turn (`MAX_TOOL_CALLS_PER_TURN`)
- SSE keepalive every 10s to prevent connection timeout
- Tool schemas loaded from bundled MCP server dist (`mcp-server-dist/`)

## Auth Architecture

- **Primary:** `src/context/NewAuthContext.tsx` → `useAuth()` (34+ consumers)
- **Clarvida only:** `src/context/ClarvidaAuthContext.tsx` (3 routes under `/clarvida/*`)
- **Deleted (do not recreate):** `UnifiedAuthContext.tsx`, `FirebaseAuthContext.tsx`, `auth-bridge.ts`, `useFirebaseAuth.ts`

## Enrichment Architecture

Waterfall: Nymeria → Hunter.io → PDL (first success wins). Cached in `enrichment_cache` Firestore (30-day TTL). Usage gated via `checkAndExecute('candidates_enriched', ...)`. All Nymeria calls have 30s timeout.

**Deprecated (do not resurrect):** `clearbit-enrichment.js` (410 Gone), `nymeriaService.ts`

## Video Meetings (Daily.co)

- **Meeting tokens** replace raw API key exposure — scoped per room, time-limited via `generateMeetingToken()`
- **Rooms auto-enable** recording data outputs: `event-json`, `transcript-webvtt`, `chat-webvtt`
- **Pipecat Cloud** replaces deprecated Daily Bots for AI interview coaching (requires `PIPECAT_API_KEY` env var)
- **Recording analyses** stored in `recording_analyses` Firestore collection (recordingId, accessLink, transcript, duration)
- **Shared utility:** `functions/utils/daily.js` — all Daily API calls route through this module

## Sidebar Navigation

Dashboard · Search · Contact Finder · Job Posting · Interviews · AI Assistant · Content Studio · Docs · Settings

**Sourcing Page (`/sourcing`):** Now follows dashboard UX pattern with stats row, quick actions, and recent searches. MinimalSearchForm gradient hero removed — page header serves as hero. Card borders updated to `border-0 shadow-sm` matching dashboard styling.
