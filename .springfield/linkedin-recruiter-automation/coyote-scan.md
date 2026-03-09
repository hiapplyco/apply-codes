# The Coyote — Peripheral Scan Report

*"I've been walkin' these files... and I noticed somethin'."*

**Session:** linkedin-recruiter-automation
**Date:** 2026-03-05
**Context:** LinkedIn candidate sourcing feature + perplexity onCall migration
**Files in Focus:** 18 files across sourcing/, functions/, background.js, popup.js
**Scan Radius:** Full extension + functions directory + Firebase config

---

## Findings by Category

### Security Shadows
*"There's a rattlesnake in that bush."*

| # | Finding | Location | Severity | Evidence |
|---|---------|----------|----------|---------|
| 1 | **Untracked .env with API keys** | `functions/.env.applycodes-2683f` | CRITICAL | Contains `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` in plaintext. NOT in .gitignore. |
| 2 | **XSS via JSON.stringify in onclick** | `content.js:813` | CRITICAL | `onclick="...writeText(${JSON.stringify(response.content)})..."` — quote breakout possible |
| 3 | **Wildcard CORS on 14+ functions** | `functions/utils/auth-cors.js:25` | HIGH | `Access-Control-Allow-Origin: *` with `authorization` in allowed headers |
| 4 | **Anonymous presence read** | `firebase/firestore-realtime.rules:10` | HIGH | `allow read: if true;` — anyone can read user online status |
| 5 | **Cross-user chat message access** | `firebase/firestore-realtime.rules:26-28` | HIGH | Any authed user can read ALL chat messages, no session validation |
| 6 | **Inline onclick patterns in content.js** | `content.js:996,1004,1056` | MEDIUM | escapeHtml in JS string context is fragile — use addEventListener |
| 7 | **No CSP header on hosting** | `firebase.json` | MEDIUM | Has X-Frame-Options and nosniff but no Content-Security-Policy |
| 8 | **Candidate fields have no max length** | `candidate-store.js` | LOW | Scraped data stored without length constraints |

### Pattern Echoes
*"Same song, different verse."*

| Finding | Location | Matches Current Fix | Effort |
|---------|----------|-------------------|--------|
| XSS in content.js onclick handlers | content.js:813,996,1004,1056 | Matches results-table.js _safeHref fix | Medium |
| Wildcard CORS in auth-cors.js | functions/utils/auth-cors.js | We removed CORS from perplexity-search — 14 others still have `*` | Medium |
| No issues with innerHTML elsewhere | popup.js, content.js | All properly use escapeHtml() | N/A (clean) |
| Auth patterns consistent | background.js | All 8 sensitive handlers have auth checks | N/A (clean) |
| process.env consistent | All functions | No defineSecret usage remains | N/A (clean) |
| onCall/onRequest split is intentional | functions/ | Webhooks=onRequest, client=onCall | N/A (clean) |

### Adjacent Opportunities
*"While y'all were busy in there..."*

| # | Finding | Location | Why It Matters | Effort |
|---|---------|----------|---------------|--------|
| 1 | **searchContacts commented out but file EXISTS** | `functions/index.js:16` | Comment says "File never created" but `search-contacts.js` is implemented | Quick |
| 2 | **githubProfile not exported** | `functions/github-profile.js` | UI calls it via function-bridge.ts:507 — will fail at runtime | Quick |
| 3 | **handleInterview not exported** | `functions/handle-interview.js` | UI calls it via function-bridge.ts:495 — will fail at runtime | Quick |
| 4 | **testOrchestration UI reference to nonexistent fn** | `src/lib/function-bridge.ts:638` | Dead reference — should be cleaned up | Quick |
| 5 | **Unused `zod` in functions/package.json** | `functions/package.json` | Not imported by any function file | Quick |

### Forgotten TODOs
*"Somebody left a note and nobody came back."*

| TODO | Location | Quick Win? |
|------|----------|-----------|
| `// TODO: Integrate with Gemini AI for more sophisticated interview responses` | `functions/handle-interview.js:50` | No |
| `// TODO: Implement AI-powered scoring system` | `functions/handle-interview.js:~85` | No |
| `// TODO: Integrate with calendar systems` | `functions/handle-interview.js:~120` | No |
| `// TODO: Add session-based access control` | `firebase/firestore-realtime.rules:27` | No — needs design |

### Consistency Gaps
*"One of these things ain't like the others."*

| Pattern A | Pattern B | Files | Recommendation |
|-----------|-----------|-------|---------------|
| v2 onCall (`firebase-functions/v2/https`) | v1 onCall (`functions.https.onCall`) | ~40 functions use v2; ~12 use v1 | Migrate v1 → v2 over time |
| `functions/.env.*` not in gitignore | `.env` IS in gitignore | Root .gitignore | Add `functions/.env.*` pattern |

### Dead Code & Drift
*"This trail goes nowhere."*

| Finding | Location | Evidence |
|---------|----------|---------|
| `testOrchestration` reference | `src/lib/function-bridge.ts:638` + `functions/index.js:112` | Function was never implemented |
| `searchContacts` wrongly commented | `functions/index.js:16` | File exists, comment is misleading |

---

## Priority Recommendations

### Quick Wins (< 5 min each)
1. **Delete `functions/.env.applycodes-2683f`** and add `functions/.env.*` to `.gitignore`
2. **Uncomment `searchContacts`** in `functions/index.js:16` — the file exists
3. **Export `githubProfile`** from `functions/index.js` — UI expects it
4. **Export `handleInterview`** from `functions/index.js` — UI expects it
5. **Remove `zod`** from `functions/package.json` — unused

### Worth Doing Soon (< 30 min each)
1. **Fix content.js XSS** — Replace inline onclick handlers at lines 813, 996, 1004, 1056 with addEventListener
2. **Restrict CORS** in `functions/utils/auth-cors.js` — change `*` to specific origin
3. **Fix Firestore rules** — require auth on presence reads, add session validation to chat messages
4. **Add CSP header** to firebase.json hosting config
5. **Rotate Google CSE API key** — it was in the untracked .env file

### Larger Efforts (track as issues)
1. **Migrate v1 functions to v2** — 12 functions still use legacy `functions.https.onCall`
2. **Implement session-based chat access** — per the TODO in Firestore rules
3. **Complete handle-interview.js** — 3 TODOs for AI scoring and calendar integration

---

## Coyote's Closing

*"The house you built is solid, friend. Good bones, good locks on the doors. But there's a key sittin' on the porch — that .env file — and a couple windows left unlatched. The rattlesnake in content.js ain't bit nobody yet, but it will. Fix those five quick things, shore up that CORS, and you'll sleep easy tonight."*

---

## Routing Decision

- **Ralph** — Fix content.js XSS (onclick → addEventListener), uncomment searchContacts, export missing functions
- **Wiggum** — CORS restriction, Firestore rules hardening, CSP header, .env cleanup
- **Smithers** — v1 → v2 function migration planning
- **Nobody** — Extension architecture, auth patterns, storage design all clean

---

<promise>COYOTE_PERIPHERAL_SCAN_COMPLETE</promise>
