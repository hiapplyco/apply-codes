# Springfield Task: Migrate from Vite to Next.js App Router

## Task Definition
Migrate the HiApply/Apply Codes recruitment platform from a Vite 7.2.4 + React 18 SPA to Next.js App Router. The platform is an AI-powered recruitment tool with 516 TypeScript files (348 .tsx + 168 .ts), Firebase backend (Auth, Firestore, Cloud Functions), and extensive Shadcn/UI component library. The migration must preserve all existing functionality while unlocking server components, streaming AI responses, API routes, and the Vercel AI SDK ecosystem for future AI-native features. Deploy to Firebase App Hosting (GA since April 2025) or Vercel.

## Context
- **Platform:** React 18.3.1 + TypeScript 5.5.3 + Vite 7.2.4 + Tailwind CSS 3.4.11
- **State Management:** Zustand 5.0.3 + TanStack React Query 5.56.2
- **UI Framework:** Shadcn/UI + 30+ Radix UI components
- **Router:** React Router DOM 6.26.2 (client-side, 26 routes)
- **Testing:** Vitest 3.0.5 + @testing-library/react
- **Backend:** Firebase (Auth, Firestore, Cloud Functions v2 onCall)
- **Deployment:** Firebase Hosting (static CDN)
- **Env Vars:** 27 VITE_* prefixed variables accessed via import.meta.env

## Affected Areas
- `vite.config.ts` → `next.config.ts`
- `index.html` → `app/layout.tsx`
- `src/main.tsx` → `app/layout.tsx` (QueryClient, providers)
- `src/App.tsx` → `app/` directory structure (file-based routing)
- All 27 `VITE_*` env vars → `NEXT_PUBLIC_*` prefix
- All `import.meta.env.*` → `process.env.*`
- `vitest.config.ts` → Jest or keep Vitest with Next.js adapter
- `package.json` scripts → next dev/build/start
- `src/components/` → stays mostly unchanged (client components)
- `src/lib/firebase.ts` → env var prefix change
- `src/lib/function-bridge.ts` → env var prefix change
- `tailwind.config.ts` → content paths update
- `postcss.config.js` → stays
- `tsconfig.json` → Next.js TypeScript config

## Success Criteria
When ALL of these are true, the task is complete:
1. [ ] `npm run dev` starts Next.js dev server — `next dev`
2. [ ] `npm run build` produces production build — `next build`
3. [ ] All 26 routes accessible and functional
4. [ ] Firebase Auth (Google OAuth) login/logout works
5. [ ] Cloud Functions callable via function-bridge.ts
6. [ ] All Shadcn/UI components render correctly
7. [ ] Tailwind CSS styles apply correctly
8. [ ] TanStack React Query provider wraps app
9. [ ] Zustand stores work unchanged
10. [ ] Environment variables load correctly (NEXT_PUBLIC_* prefix)
11. [ ] No `import.meta.env` references remain in source
12. [ ] No `vite` imports remain in source
13. [ ] TypeScript compilation passes — `npx tsc --noEmit`
14. [ ] Path alias `@/` resolves correctly
15. [ ] Dev proxy to ADK agent works (or equivalent API route)

## Scope

**In Scope:**
- Replace Vite with Next.js App Router
- Convert file-based routing from React Router to Next.js app/ directory
- Rename all VITE_* env vars to NEXT_PUBLIC_*
- Update all import.meta.env references to process.env
- Move providers (Auth, Query, Project) to root layout
- Keep ALL components as client components initially ("use client")
- Update build/dev/deploy scripts
- Update TypeScript config for Next.js
- Update Tailwind config content paths
- Remove Vite-specific dependencies (vite, @vitejs/plugin-react-swc, lovable-tagger)
- Add Next.js dependencies (next, @next/*)
- Update testing setup if needed

**Out of Scope:**
- Converting components to Server Components (future phase)
- Adding Vercel AI SDK (future phase)
- Changing Firebase backend architecture
- Redesigning any UI components
- Adding new features
- Optimizing bundle size beyond what Next.js provides
- MCP UI integration (future phase)
- Server-side rendering optimization (future phase)

## Risks & Considerations
- **Breaking change risk: HIGH** — 516 files affected by env var changes alone
- **React Router → Next.js routing** — Dynamic routes, nested layouts, protected routes all need conversion
- **Firebase SSR incompatibility** — Firebase client SDK uses browser APIs. All Firebase code must be in client components
- **Package compatibility** — Some packages may not work with Next.js (daily-co, three.js, tiptap)
- **Build time increase** — Next.js builds are slower than Vite
- **Lovable-tagger plugin** — Dev-only, needs removal or Next.js equivalent

## Backpressure (DO NOT skip)
```bash
# Before claiming COMPLETE, verify:
npm run build          # Next.js production build succeeds
npx tsc --noEmit       # TypeScript passes
npm run lint           # ESLint passes
npm run dev            # Dev server starts without errors
```

If ANY check fails, fix issues FIRST. Do NOT output COMPLETE with failures.

## Notes for Implementation

### Migration Strategy: Incremental (NOT big-bang)
1. **Phase 1: Scaffold Next.js alongside Vite** — Install next, create app/ directory
2. **Phase 2: Move root layout** — index.html → app/layout.tsx, providers
3. **Phase 3: Convert routes** — One route group at a time (public, protected, clarvida)
4. **Phase 4: Environment variables** — Bulk rename VITE_* → NEXT_PUBLIC_*
5. **Phase 5: Remove Vite** — Delete vite.config.ts, remove deps, update scripts
6. **Phase 6: Verify** — Full build, typecheck, manual route testing

### Key Patterns
- Mark ALL existing components with `"use client"` — they all use hooks, state, browser APIs
- Use Next.js `app/layout.tsx` for the provider tree (Auth, Query, Project, Clarvida)
- Use Next.js `app/(public)/` and `app/(protected)/` route groups for auth boundaries
- Use Next.js middleware for auth checks instead of ProtectedRoute component
- Keep function-bridge.ts as-is (just change env var prefix)
- Keep Zustand stores as-is (client-side only)
- The API proxy (`/api` → Cloud Run) can become a Next.js API route or next.config.ts rewrite

### Anti-patterns to Avoid
- Do NOT try to make Firebase SDK work in server components
- Do NOT convert any component to server component in this phase
- Do NOT add `getServerSideProps` or server actions — keep it client-side for now
- Do NOT change the deployment target yet — keep Firebase Hosting
