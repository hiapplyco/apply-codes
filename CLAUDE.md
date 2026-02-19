# CLAUDE.md — HiApply (Apply Codes)

## Project

AI recruitment platform fighting "Brain Waste" — underutilization of skilled veterans, immigrants, military spouses.

## Key Features

- **Boolean candidate search** — Google CSE + AI-powered query generation
- **Contact enrichment** — Email, phone, GitHub, social profiles
- **Job posting** — AI-optimized job description creation and editing
- **Interview tools** — AI-guided video interviews via Daily.co
- **Content studio** — LinkedIn posts, outreach emails, job descriptions
- **AI assistant** — Recruitment copilot chat
- **MCP Server** — Custom recruitment tools (v2.0.0, 11 tools)

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Backend: Firebase Cloud Functions (Node.js)
- Database: Firestore (primary), Supabase PostgreSQL (legacy, 3 functions)
- AI: Google Gemini (gemini-3-pro-preview), Anthropic APIs
- Auth: Firebase Auth (see Auth Architecture below)
- Storage: Firebase Storage

## Navigation (Sidebar)

Grouped sidebar in `src/components/layout/SidebarNew.tsx`:
- **Dashboard** (`/dashboard`) — Activity command center with stats, recent searches, projects
- **RECRUIT**: Search (`/sourcing`), Contact Finder (`/enrichment`), Job Posting (`/job-post`)
- **ENGAGE**: Interviews (`/meeting`), AI Assistant (`/chat`), Content Studio (`/content-creation`)
- **Bottom**: Documentation (`/documentation`), Settings (`/profile`)

Dynamic routes (not in sidebar): `/report/:jobId`, `/analytics/:jobId`, `/projects/:projectId`, `/job-editor/:id`

## Commands

```bash
npm run dev         # Dev server (Vite)
npm run build       # Production build
npm test            # Tests (Vitest)
cd functions && node -e "require('./index')"  # Validate functions
cd mcp-server && npm run build                # Build MCP server
```

## Auth Architecture

Two auth contexts, one primary:

- **`src/context/NewAuthContext.tsx`** — Primary auth context (34+ consumers). Provides `useAuth()` hook for all main app routes. Uses `useMemo`/`useCallback` for stable references.
- **`src/context/ClarvidaAuthContext.tsx`** — Clarvida-specific auth (3 routes under `/clarvida/*` only). Do NOT use outside Clarvida.

Supporting files:
- `src/components/auth/ProtectedRoute.tsx` — Route guard with dev bypass (`VITE_BYPASS_AUTH`)
- `src/pages/AuthCallback.tsx` — OAuth callback with open-redirect prevention (relative paths only)
- `src/pages/Login.tsx` — Unified error messages to prevent account enumeration

**Deleted (do not recreate):** `UnifiedAuthContext.tsx`, `FirebaseAuthContext.tsx`, `auth-bridge.ts`, `useFirebaseAuth.ts`

## Key Directories

- `src/` — Frontend (React components, hooks, contexts, lib)
- `functions/` — Firebase Cloud Functions (74 files)
- `mcp-server/` — Custom MCP server (apply-recruitment v2.0.0)

## MCP Server

Custom `apply-recruitment` MCP at `mcp-server/dist/server.js`
- 11 tools: boolean search, job analysis, market intel, resume parsing, interviews
- 5 resources: candidate schema, job requirements, skills taxonomy, search filters, tool guide
- 5 prompts: source candidates, analyze resume, plan recruitment, search guide, tool help
- SDK: @modelcontextprotocol/sdk v1.26.0

## Contact

james@hiapply.co
