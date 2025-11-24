# Project Policy & Workflow for AI Assistants (Gemini CLI + MCP Clients)

This repository uses **Model Context Protocol (MCP)** broadly (Gemini CLI and other MCP-capable clients). This file defines policy, guardrails, and workflows the assistant MUST follow.

---

## ▮ Always-On Rules (Stack-specific)
- Language/Runtime: **TypeScript 5+**, **Node 20 LTS**
- Frontend: **React 18 + Vite** (prefer function components & hooks; A11y required)
- Backend: **Firebase Functions (Node 20)**
- Database: **Firestore** (prefer transactions / batched writes; avoid N+1 reads)
- Lint/Format: **ESLint** as source of truth; run `eslint --fix` before proposing final diffs
- Tests: **Vitest**; keep coverage ≥ **80%** for changed areas
- Types: run `tsc --noEmit` (or project `typecheck` script) before concluding IMPLEMENT
- Secrets: never commit or echo secrets/PII; use env vars / Firebase config; mask in logs

## ▮ Firebase & Firestore Guardrails
- Use **Firebase Emulator Suite** for local/integration tests; do **NOT** write to prod without explicit approval
- Don’t change **security rules** or **indexes** unless requested; if requested, propose the diff + rules tests
- Functions: validate inputs (e.g., zod), sanitize logs, avoid long blocking calls (use queues/async)

---

## ▮ Control States (Gated Execution)
Assistant operates in exactly one mode:
- **EXPLAIN** — analyze/discuss; **no tool runs or writes**
- **PLAN** — produce a numbered, actionable plan; **no runs or writes**
- **IMPLEMENT** — execute only after an explicit PLAN approval

**Mode discipline**
- Ask: “Proceed in `EXPLAIN`, `PLAN`, or `IMPLEMENT`?”
- Do **not** enter IMPLEMENT without an approved PLAN visible in chat
- **Before any file write in IMPLEMENT**: show a **unified diff** and wait for approval
- After writes: run lint → typecheck → (if requested) tests; summarize & fix failures

---

## ▮ MCP-Aware Policy (Broad support, not just Gemini CLI)
Use configured MCP tools instead of scraping/guessing. If a needed tool is missing, propose it and pause.

### Tool-Invocation Contract (every MCP call MUST include)
- **Reason** (why this tool)
- **Scope** (which entity/domain)
- **Expected data/output**
- **Privacy note** (PII/secret handling, masking)
- **Approval check** (“Proceed?”). Do not send queries with PII without explicit approval.

### Allowed Tools (Registry & Permissions)
The following tools are allowed when present in project or user settings. Only call the tools listed here.

#### Core Dev & QA
- **GitHub MCP** — repo read/write, issues/PRs, code scanning  
  - *Use for*: code search, PR reviews, opening issues with reproduction, small patches  
  - *Approval*: required for any write (issue/PR/create/commit)
- **Playwright MCP** — real browser automation/screens for e2e checks on React+Vite  
  - *Use for*: e2e smoke on critical flows; attach traces/screens on failure  
  - *Approval*: required to run tests; never post sensitive screenshots

#### Cloud & Databases
- **Firebase MCP** — Firestore/Auth/Storage operations  
  - *Use for*: emulator-scoped reads/writes, metadata inspection  
  - *Approval*: required for any prod action; emulator preferred

#### Productivity / Knowledge
- **Google Workspace MCPs** — Drive/Gmail/Calendar  
  - *Use for*: scheduling, file lookup (no sensitive attachments)  
  - *Approval*: required for sends/writes

#### Enrichment & Research
- **Perplexity (Sonar) MCP** — web research with citations  
  - *Use for*: feature comparisons, API nuances; include citations; no PII
- **Firecrawl MCP** — crawler/scraper for deep content extraction  
  - *Use for*: explicit URLs and scope; rate-limit; respect robots/noindex; approval required
- **Hunter.io MCP** — email find/verify & domain/company intel  
  - *Use for*: allowed domains only; compliance note required; **explicit approval required**

#### Communication
- **Twilio MCP** — SMS/Voice messaging
  - *Use for*: Sending notifications, alerts, or messages through Twilio services.
  - *Approval*: required for any message sending.

**Dangerous/Destructive (prohibited without explicit approval)**  
File deletions/renames, `rm`/`sudo`, network calls to unknown hosts, writes to prod Firestore/config, mass updates, or enrichment on PII.

---

## ▮ Coding Style & Quality
- TS strictness preferred; avoid `any` unless justified; centralize types in `src/types/*`
- API clients in `src/lib/api/*`; create a typed `HttpError`
- React: colocate component + tests; memoize judiciously; ensure aria/focus order
- Logging: structured; never swallow exceptions; no sensitive data in logs

## ▮ Commit, Diff & Review Discipline
- Small, focused diffs per PLAN step, each with rationale & risk note
- Commit messages: `feat(scope): …` / `fix(scope): …` / `refactor(scope): …`
- Don’t mix refactor + features unless trivial and stated

## ▮ Tests-First Flow (Strongly Preferred)
1) Add/adjust failing **Vitest** specs capturing the requirement  
2) Implement minimal code to pass  
3) Refactor safely; re-run tests; keep coverage ≥ **80%** on touched areas  
4) For Firestore, prefer emulator-backed tests (queries + rules)

---

## ▮ Directory Overlays (Repo-specific)
### `functions/` (Firebase Functions)
- Node 20; validate inputs (zod if present); CORS for HTTPS functions
- Use Firestore **transactions** and **batched writes** appropriately
- Don’t block on long external calls; prefer async/queues

### `src/api/`
- Keep REST helpers idempotent; centralize base URL/interceptors; convert failures to `HttpError`

### `src/ui/`
- Use design tokens/theme; add A11y checks; create Storybook stories if Storybook exists

### `src/lib/firebase.ts`
- Initialize Firebase once; use `getApps()`/`getApp()` pattern

---

## ▮ PLAN Mode Output (Exact Schema)
Produce the following headings verbatim:
1. **Goals** — user-facing outcomes  
2. **Investigation** — files inspected, commands to run, MCP tools you *propose* to call (purpose + approval line)  
3. **Proposed Steps** — numbered; each ≤ ~10 lines; reference target files  
4. **Risks & Mitigations** — concrete risks with mitigations  
5. **Test Plan** — unit/integration tests to add/update and how to run them

Wait for explicit approval before IMPLEMENT.

---

## ▮ IMPLEMENT Rules (Exact)
For each approved step:  
1) Show a **unified diff**; await approval  
2) After write: run `eslint --fix` → `tsc --noEmit` → (if requested) `vitest --coverage`; summarize results  
3) If failures: diagnose, propose fix, show new diff, re-run  
4) Do **not** delete/rename files or modify CI/infra without explicit approval

---

## ▮ Documentation & DX
- Update README or `/docs/` when behavior/setup/env vars change  
- For new scripts/CLI, include `--help` output & usage examples  
- For APIs, update OpenAPI/endpoint docs if present

---

## ▮ Non-Functional Expectations (tune as needed)
- UI: avoid blocking main thread; justify bundle increases  
- Backend: Functions P95 latency ≤ <X> ms; log cold starts; basic metrics

---

## ▮ Security & Versions
- Prefer **official vendors** (Firebase, GitHub, Notion, Pinecone, etc.) or curated catalogs (e.g., mcpservers directories)
- **Pin versions** for MCP servers; review scopes/permissions; rotate creds periodically and after any advisories
- Never store raw enrichment outputs containing PII; summarize, mask, or hash

---

## ▮ Out-of-Scope / Never Do
- No tracking without consent  
- No license/governance changes  
- No production writes or enrichment on PII without explicit approval in chat