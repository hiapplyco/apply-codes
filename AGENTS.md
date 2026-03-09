# AGENTS.md — Apply.codes AI Recruitment Platform

## Commands

```bash
npm run dev              # Next.js dev (3000)
npm run build            # Production build
npm test                 # Unit tests (Vitest)
npm run lint             # ESLint
npm run typecheck        # TypeScript check
firebase emulators:start # Local emulators
firebase deploy --only functions
firebase deploy --only firestore:rules
```

**Docs:** `docs/MASTER_TRACKING_DOCUMENT.md`, `mcp-server/README.md`

## Conventions

- TypeScript strict, `interface` over `type`, no `any` without justification
- Functional components + hooks, use existing `src/components/ui/` (shadcn)
- **No comments** unless explicitly requested — self-documenting code
- Firebase Functions: `onCall` pattern, validate `context.auth`, return `{ success, result }`
- Read files before editing; check imports + neighboring files for patterns

## Key Paths

- `firebase.json` — Firebase config
- `next.config.ts` — Next.js config
- `mcp-server/src/index.ts` — MCP entry point
- `functions/src/index.ts` — Cloud Functions entry

## Env Vars

```bash
# Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY · NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN · NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET · NEXT_PUBLIC_GOOGLE_CLIENT_ID · GEMINI_API_KEY

# Functions
firebase functions:config:set gemini.key="xxx" nymeria.key="xxx"
```

## Security

Never commit `.env.local` · Firebase Auth required · Firestore rules enforced · Validate all inputs
