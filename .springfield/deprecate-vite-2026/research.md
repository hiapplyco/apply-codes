# Lisa's Research Summary

## Decision: Next.js App Router
- User chose Next.js App Router for maximum future-proofing
- Enables RSC, streaming UI, Vercel AI SDK ecosystem
- Firebase App Hosting (GA April 2025) supports Next.js
- Largest framework ecosystem for AI-native apps

## Key Migration Stats
- 516 TypeScript files (348 .tsx + 168 .ts)
- 47 files import from react-router-dom
- 22+ environment variables need VITE_* → NEXT_PUBLIC_* rename
- 24 routes (9 public, 13 protected, 3 clarvida)
- 2 auth contexts (NewAuth + Clarvida)
- 1 layout (MainLayout with sidebar)
- All components must be "use client" initially (hooks, state, browser APIs)

## Framework Research
- Next.js App Router: Best RSC support, Vercel AI SDK, largest ecosystem
- TanStack Start: Vite-native, RC status, smaller ecosystem
- React Router v7: Remix patterns, proven stability
- Firebase App Hosting supports Next.js (GA)
