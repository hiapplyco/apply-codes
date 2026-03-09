# Plan: Vite → Next.js App Router Migration

## Success Criteria (ALL must be checked)
1. [ ] `npm run dev` starts Next.js dev server
2. [ ] `npm run build` produces production build
3. [ ] All 24 routes accessible and functional
4. [ ] Firebase Auth login/logout works
5. [ ] Cloud Functions callable via function-bridge.ts
6. [ ] Shadcn/UI components render correctly
7. [ ] Tailwind CSS styles apply correctly
8. [ ] Environment variables load (NEXT_PUBLIC_*)
9. [ ] No import.meta.env references remain
10. [ ] No vite imports remain
11. [ ] TypeScript compilation passes
12. [ ] Path alias @/ resolves correctly

## Subtasks

| # | Task | Files | Verify | Status |
|---|------|-------|--------|--------|
| 1 | Install Next.js, create next.config.ts | package.json, next.config.ts | `npx next --version` | ⬜ |
| 2 | Create app/layout.tsx with providers | app/layout.tsx, app/globals.css | Dev server starts | ⬜ |
| 3 | Create public route group | app/(public)/*.tsx (9 routes) | Routes render | ⬜ |
| 4 | Create protected route group with layout | app/(protected)/layout.tsx + 13 routes | Routes render with sidebar | ⬜ |
| 5 | Create clarvida route group | app/(clarvida)/*.tsx (3 routes) | Clarvida routes render | ⬜ |
| 6 | Create middleware.ts for auth + redirects | middleware.ts | Auth redirect works | ⬜ |
| 7 | Rename env vars VITE_* → NEXT_PUBLIC_* | .env.local, 11 source files | Env vars load | ⬜ |
| 8 | Replace react-router-dom imports | 47 files | No RR imports remain | ⬜ |
| 9 | Remove Vite deps, update scripts | package.json, delete vite.config.ts | `npm run build` passes | ⬜ |
| 10 | Update firebase.json hosting config | firebase.json | Deploy config valid | ⬜ |
| 11 | Update TypeScript config | tsconfig.json, tsconfig.app.json | `npx tsc --noEmit` | ⬜ |
| 12 | Update test setup | vitest → jest or next/jest | Tests pass | ⬜ |

## Dependencies
1 → 2 → 3,4,5 (parallel) → 6 → 7 → 8 → 9 → 10,11,12 (parallel)

## Success Mapping
- Criteria 1,2: Subtasks 1,2,9
- Criteria 3: Subtasks 3,4,5,6
- Criteria 4,5: Subtasks 7,8
- Criteria 6,7: Subtask 2 (globals.css, component compatibility)
- Criteria 8,9,10: Subtasks 7,8,9
- Criteria 11: Subtask 11
- Criteria 12: Subtask 2,11
