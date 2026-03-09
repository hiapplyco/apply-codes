# PROMPT.md -- LinkedIn Autonomous Candidate Sourcing

## Task Definition

Add an autonomous LinkedIn candidate sourcing feature to the existing "Apply Codes - AI Recruiting Tools" Chrome extension (MV3, v1.3.0). The extension must navigate LinkedIn dashboards autonomously via content scripts, fill in search fields, apply filters, scroll through results, and collect candidates into an exportable table -- all driven by natural-language criteria the user specifies.

Three LinkedIn dashboard targets must be supported, each with distinct DOM structures and URL patterns:

1. **LinkedIn Recruiter** (enterprise) -- `https://www.linkedin.com/talent/*`
2. **LinkedIn Recruiter Lite** -- `https://www.linkedin.com/recruiter/*` and `https://www.linkedin.com/cap/*`
3. **Regular LinkedIn Search** -- `https://www.linkedin.com/search/results/people/*` and `https://www.linkedin.com/mynetwork/*`

The user is already authenticated into their LinkedIn account. The extension does NOT log in on their behalf. It only automates search navigation and data collection on the currently active LinkedIn session.

**Approach:** Pure Chrome extension content scripts. No CDP, no Puppeteer, no external browser control. Scripts interact with the LinkedIn DOM directly, using `chrome.scripting`, content script injection, and message passing through the existing `background.js` service worker.

---

## Success Criteria

### SC-1: Dashboard Detection and Router
- [ ] Extension detects which of the three LinkedIn dashboard types the user is on (Recruiter, Recruiter Lite, Regular) based on URL pattern and DOM fingerprints.
- [ ] A `DashboardDetector` module returns an enum value (`recruiter | recruiterLite | regularSearch`) and the appropriate adapter is loaded.
- **Verification:** Navigate to each of the three dashboard types. Open DevTools console. Confirm the correct dashboard type is logged. Confirm the adapter initializes without errors.

### SC-2: Search Criteria Input Panel
- [ ] A new UI panel (slide-out sidebar or overlay, consistent with the existing sidebar design in `content.js`) allows the user to specify search criteria in natural language and/or structured fields.
- [ ] Structured fields include: job title, location, skills (comma-separated), years of experience (range), current company, industry, keywords, and boolean modifiers.
- [ ] A "Start Sourcing" button initiates the autonomous workflow.
- [ ] A "Stop" button halts automation at any point, preserving already-collected results.
- **Verification:** On each of the three dashboards, open the sourcing panel. Fill in criteria. Confirm all fields accept input and the Start button is enabled. Confirm Stop halts mid-run.

### SC-3: Autonomous Navigation Engine
- [ ] The extension translates user criteria into dashboard-specific search actions (filling search boxes, selecting filter dropdowns, toggling boolean operators, applying location filters).
- [ ] Each dashboard adapter implements a common interface: `fillSearchQuery(query)`, `applyFilters(filters)`, `getResultCards()`, `extractProfileData(card)`, `goToNextPage()`, `isLastPage()`.
- [ ] Navigation includes human-like timing: randomized delays between 800ms-2500ms for typing, 1500ms-4000ms between page actions, and scroll-pause patterns.
- [ ] The engine handles LinkedIn SPA navigation (URL changes without full page reload) using `MutationObserver` on `document.body` and `popstate`/`hashchange` listeners.
- **Verification:** Set criteria for "Senior Software Engineer, San Francisco, Python, 5+ years". Start sourcing on each dashboard. Observe the extension filling fields, applying filters, and paginating through at least 3 pages of results. Confirm human-like delays are visible.

### SC-4: Candidate Data Extraction
- [ ] For each result card on the search results page, the extension extracts: name, headline/title, location, current company, profile URL, and any visible skills or experience summary.
- [ ] Extracted data is normalized into a common `CandidateRecord` schema regardless of which dashboard was used.
- [ ] Duplicate candidates (same profile URL) are deduplicated.
- **Verification:** After a sourcing run of 50+ candidates, inspect the collected data. Confirm all fields are populated (name, title, location, company, URL at minimum). Confirm no duplicate profile URLs.

### SC-5: Results Table with Export
- [ ] Collected candidates are displayed in a scrollable, sortable table within the extension sidebar/panel.
- [ ] Table columns: Name, Title, Company, Location, Profile URL, Skills (if available), Date Collected.
- [ ] Table supports: sort by any column, filter/search within results, select/deselect rows.
- [ ] Export options: Copy to clipboard (as tab-separated values), download as CSV, and share (copy a shareable summary to clipboard).
- [ ] The table persists in `chrome.storage.local` so results survive tab close and browser restart.
- **Verification:** After a sourcing run, open the results table. Sort by each column. Filter by a keyword. Select 5 candidates. Copy to clipboard and paste into a spreadsheet -- confirm formatting. Export as CSV and open -- confirm valid CSV. Close and reopen the browser. Confirm results are still present.

### SC-6: Integration with Existing Cloud Functions
- [ ] The "Start Sourcing" workflow optionally calls the existing `generateBooleanSearch` or `generateSophisticatedBoolean` Cloud Function to convert natural-language criteria into an optimized boolean string before injecting it into the LinkedIn search box.
- [ ] Individual candidate profiles can be sent to `analyzeCandidate` for AI evaluation directly from the results table (a per-row action button).
- [ ] Authentication uses the existing `getAuthToken()` flow in `background.js`.
- **Verification:** Enter natural-language criteria ("I need a senior React developer in Austin who has AWS experience"). Confirm the extension calls the boolean generation function and injects the result. Click "Analyze" on a result row. Confirm the `analyzeCandidate` function is called and the result is displayed.

### SC-7: Manifest and Content Script Updates
- [ ] `manifest.json` is updated to inject content scripts on the additional URL patterns (recruiter, search results, etc.) while preserving the existing `/in/*` injection.
- [ ] The `scripting` permission is already present; confirm it is used for programmatic injection as a fallback when declarative injection misses SPA navigations.
- [ ] Extension version is bumped to `1.4.0`.
- **Verification:** Load the unpacked extension. Navigate to each target URL pattern. Confirm content scripts are injected (check for the sidebar tab or a console log marker). Confirm the existing profile page sidebar still works on `/in/*` pages.

---

## Scope Boundaries

### In Scope
- Content script automation for the three LinkedIn dashboard types listed above.
- New search criteria UI panel within the extension.
- Candidate extraction and results table with export.
- Integration with existing `generateBooleanSearch`, `generateSophisticatedBoolean`, and `analyzeCandidate` Cloud Functions via the existing `background.js` message passing pattern.
- Human-like interaction timing to reduce detection risk.
- `chrome.storage.local` persistence for collected candidates.
- Manifest updates for new URL patterns and version bump.

### Out of Scope
- Logging into LinkedIn on the user's behalf.
- Direct LinkedIn API access (no official API calls; this is DOM-based automation).
- Contact enrichment during the sourcing run (that is handled separately by existing enrichment features).
- Modifying the web app (`src/` directory) -- this feature lives entirely in `apply-codes-extension/`.
- Creating new Cloud Functions -- reuse existing ones only.
- InMail or messaging automation.
- Profile page scraping beyond what is visible on search result cards (deep profile scraping is the existing `content.js` feature on `/in/*` pages).
- Rate limiting or quota management for LinkedIn (beyond human-like timing).
- Mobile or Firefox support.

### Deferred / Future
- Saved search templates (save and replay criteria sets).
- Scheduled/background sourcing (run searches while the user does other things).
- Recruiter Seat detection (warn if user does not have Recruiter access).
- Integration with the web app's project system (saving candidates to Firestore projects).

---

## Risk Identification

### R1: LinkedIn DOM Instability (HIGH)
**Risk:** LinkedIn frequently changes class names, data attributes, and DOM structure. Hard-coded selectors will break.
**Mitigation:** Use a layered selector strategy: (1) prefer `data-*` attributes and ARIA roles over class names, (2) use semantic selectors (e.g., `input[role="combobox"]`, `button[aria-label*="Search"]`), (3) build a `SelectorRegistry` per dashboard adapter that centralizes all selectors and can be updated in one place, (4) include a fallback heuristic layer that uses text content matching when selectors fail.

### R2: LinkedIn Automation Detection (HIGH)
**Risk:** LinkedIn uses client-side detection for bot-like behavior (rapid clicks, uniform timing, no mouse movement, excessive page loads). This can trigger CAPTCHA challenges or account restrictions.
**Mitigation:** (1) Randomized delays with Gaussian distribution rather than uniform random, (2) simulate realistic scroll behavior (smooth scroll, pause at content, occasional scroll-back), (3) inject synthetic mouse events along natural paths before clicks, (4) limit pagination to a configurable max (default: 10 pages per run), (5) add a "cooling off" pause every N pages (default: every 3 pages, pause 5-15 seconds), (6) surface a clear warning in the UI that the user assumes responsibility for LinkedIn ToS compliance.

### R3: Three Dashboard Variants Multiply Complexity (MEDIUM)
**Risk:** Maintaining three separate DOM adapters triples the surface area for bugs and selector rot.
**Mitigation:** Define a strict `DashboardAdapter` interface. Each adapter only implements DOM-specific logic. All orchestration, timing, state management, and UI logic is shared. Start with Regular LinkedIn Search (most users, simplest DOM), then Recruiter Lite, then full Recruiter. Ship iteratively.

### R4: SPA Navigation Breaks Content Script State (MEDIUM)
**Risk:** LinkedIn is a single-page application. URL changes do not trigger content script re-injection. Moving between search results, profile pages, and dashboard views can leave the extension in an inconsistent state.
**Mitigation:** Use `MutationObserver` on `document.body` to detect navigation, combined with URL polling (`setInterval` checking `location.href`). Re-initialize the active adapter when a relevant URL change is detected. Store automation state in a class instance that persists across SPA navigations.

### R5: Extension Performance and Memory (LOW-MEDIUM)
**Risk:** Collecting hundreds of candidates in `chrome.storage.local` and maintaining large DOM observer trees could degrade browser performance.
**Mitigation:** Cap stored candidates at 5,000. Use pagination in the results table UI (50 per page). Disconnect MutationObservers when not actively sourcing. Use `chrome.storage.local` batch writes instead of per-candidate writes.

### R6: Existing Content Script Conflicts (LOW)
**Risk:** The new content scripts could conflict with the existing `content.js` that runs on `/in/*` profile pages, especially if both try to inject sidebars.
**Mitigation:** The existing `content.js` guards with `window.applyCodesInjected`. The new sourcing script should use a separate guard (`window.applyCodesSourcingInjected`). The two scripts serve different pages and should not overlap, but if they do, the guard prevents double-injection.

---

## Backpressure Checks

### BP-1: Is this actually a Chrome extension task?
**Yes.** The requirement is to automate browser interaction with LinkedIn dashboards. This cannot be done from a web app or Cloud Function. It must be a content script running in the LinkedIn tab. The existing extension already has `host_permissions` for `*.linkedin.com/*` and the `scripting` permission.

### BP-2: Does this conflict with existing extension functionality?
**Minimal conflict.** The existing content script (`content.js`) only runs on `/in/*` profile pages. The new feature targets search/results pages with different URL patterns. The existing popup, background service worker, and auth flow are reused as-is with new message types added.

### BP-3: Is the scope reasonable for a single implementation phase?
**Borderline.** Three dashboard adapters is ambitious. The recommended approach is to implement the full architecture and shared infrastructure, but ship with only the Regular LinkedIn Search adapter complete. Recruiter and Recruiter Lite adapters can follow as fast-follows using the same interface. The PROMPT should be structured so an implementer can ship Regular Search first and the other two are clearly additive.

### BP-4: Are there legal/ToS concerns?
**Yes.** LinkedIn's User Agreement prohibits automated scraping and data collection. This tool automates actions on behalf of a user who is already authenticated. The extension should include a ToS compliance warning that the user must acknowledge before first use. The implementation should avoid any data extraction beyond what is visible on screen, and should not circumvent any access controls.

### BP-5: Can existing Cloud Functions be reused without modification?
**Yes.** `generateBooleanSearch` (onCall) and `analyzeCandidate` (onCall) are already callable from the extension via `background.js`. The message format is already established. No new Cloud Functions are needed.

---

## Implementation Notes

### Architecture Overview

```
apply-codes-extension/
  manifest.json              -- Updated: new content_scripts entries, version bump
  background.js              -- Updated: new message handlers for sourcing actions
  content.js                 -- UNCHANGED: existing profile page sidebar
  sourcing/
    sourcing-content.js      -- NEW: entry point for sourcing content script
    dashboard-detector.js    -- NEW: detects which LinkedIn dashboard is active
    adapters/
      base-adapter.js        -- NEW: abstract DashboardAdapter interface
      regular-search.js      -- NEW: adapter for linkedin.com/search/results/people/*
      recruiter-lite.js      -- NEW: adapter for Recruiter Lite
      recruiter.js           -- NEW: adapter for full Recruiter
    automation-engine.js     -- NEW: orchestrates search, pagination, extraction
    timing.js                -- NEW: human-like delay utilities
    candidate-store.js       -- NEW: chrome.storage.local CRUD for candidates
    ui/
      sourcing-panel.js      -- NEW: search criteria input + results table UI
      results-table.js       -- NEW: sortable, filterable candidate table
      export.js              -- NEW: CSV export, clipboard copy, share
  sourcing/sourcing.css      -- NEW: styles for sourcing panel
```

### Manifest Changes

```json
{
  "version": "1.4.0",
  "content_scripts": [
    {
      "matches": ["https://*.linkedin.com/in/*"],
      "js": ["content.js"]
    },
    {
      "matches": [
        "https://*.linkedin.com/search/results/*",
        "https://*.linkedin.com/talent/*",
        "https://*.linkedin.com/recruiter/*",
        "https://*.linkedin.com/cap/*",
        "https://*.linkedin.com/mynetwork/*"
      ],
      "js": ["sourcing/sourcing-content.js"],
      "css": ["sourcing/sourcing.css"]
    }
  ]
}
```

### DashboardAdapter Interface

Every adapter must implement:

```javascript
class DashboardAdapter {
  /** Return true if this adapter handles the current page */
  static canHandle(url, document) {}

  /** Fill the main search input with the given query string */
  async fillSearchQuery(query) {}

  /** Apply structured filters (location, experience, etc.) */
  async applyFilters(filters) {}

  /** Return an array of DOM elements representing result cards */
  getResultCards() {}

  /** Extract candidate data from a single result card element */
  extractProfileData(cardElement) {}

  /** Navigate to the next page of results. Returns false if on last page. */
  async goToNextPage() {}

  /** Return true if there are no more pages */
  isLastPage() {}

  /** Return the current page number */
  getCurrentPage() {}
}
```

### CandidateRecord Schema

```javascript
{
  id: string,              // Generated UUID
  name: string,
  headline: string,        // Job title / headline
  company: string,
  location: string,
  profileUrl: string,      // LinkedIn profile URL
  skills: string[],        // Visible skills if any
  experienceSummary: string,
  source: 'recruiter' | 'recruiterLite' | 'regularSearch',
  collectedAt: string,     // ISO 8601 timestamp
  searchCriteria: string,  // The criteria used for this sourcing run
  analyzed: boolean,       // Whether analyzeCandidate has been run
  analysisResult: object | null
}
```

### Background Message Types (new)

Add to `background.js` alongside existing message handlers:

| Action | Direction | Purpose |
|--------|-----------|---------|
| `startSourcing` | panel -> background | Kicks off sourcing. Payload: criteria object. Background calls `generateBooleanSearch` if `useAI: true`, returns boolean string to content script. |
| `sourcingProgress` | content -> background | Reports progress (candidates found, current page, status). Background relays to any listening popup. |
| `sourcingComplete` | content -> background | Signals completion. Payload: summary stats. |
| `analyzeCandidateFromTable` | panel -> background | Sends a single candidate to `analyzeCandidate`. Uses existing handler pattern. |
| `getSourcingResults` | popup -> background | Retrieves stored candidates from `chrome.storage.local`. |

### Timing Utilities

```javascript
// Gaussian-distributed random delay
function humanDelay(minMs, maxMs) {
  const mean = (minMs + maxMs) / 2;
  const stdDev = (maxMs - minMs) / 6;
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const delay = Math.round(mean + z * stdDev);
  return Math.max(minMs, Math.min(maxMs, delay));
}

// Type text character by character with random inter-key delays
async function humanType(element, text) {
  element.focus();
  for (const char of text) {
    element.value += char;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(humanDelay(50, 150));
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
```

### Key Selectors to Investigate (starting points)

**Regular LinkedIn Search (`/search/results/people/`):**
- Search input: `input.search-global-typeahead__input`
- Result cards: `div.entity-result__item` or `li.reusable-search__result-container`
- Name: `span.entity-result__title-text > a > span[aria-hidden="true"]`
- Headline: `div.entity-result__primary-subtitle`
- Location: `div.entity-result__secondary-subtitle`
- Next page: `button[aria-label="Next"]`

**LinkedIn Recruiter:**
- Result cards: `li.profile-list__border-bottom` or `div[data-test-profile-card]`
- Filters panel: often `div.facet-container` or similar
- These selectors change frequently -- the adapter MUST be built for resilience.

**Important:** These selectors are approximate and MUST be verified against the live DOM at implementation time. LinkedIn's DOM changes regularly. The implementation should include a selector validation step on startup that logs warnings for any selectors that do not match.

### Implementation Order

1. **Phase 1 (MVP):** `dashboard-detector.js`, `timing.js`, `candidate-store.js`, `sourcing-panel.js` (UI), `results-table.js`, `export.js`, `regular-search.js` adapter, manifest updates, background message handlers. This delivers a working feature for Regular LinkedIn Search.

2. **Phase 2:** `recruiter-lite.js` adapter. Same architecture, just new selectors and filter interaction patterns.

3. **Phase 3:** `recruiter.js` adapter for the full enterprise Recruiter product.

### Existing Code to Reuse

- **`background.js` auth flow:** `getAuthToken()` and `callFirebaseFunction()` -- reuse for `generateBooleanSearch` and `analyzeCandidate` calls.
- **`background.js` message listener pattern:** Follow the existing `chrome.runtime.onMessage.addListener` pattern with `(async () => { ... })()` for async handlers.
- **`content.js` sidebar pattern:** The existing sidebar tab, slide-out panel, and styling approach should be replicated (not shared, since the two scripts serve different pages) for the sourcing panel.
- **`content.js` SPA navigation observer:** The existing `MutationObserver` pattern for URL change detection should be adopted and extended.
- **Cloud Functions:** `generateBooleanSearch` (callable via `{ data: { description, jobTitle } }`), `analyzeCandidate` (callable via `{ data: { candidate, requirements } }`).
- **Search types from web app:** The `CandidateRecord` schema should be compatible with the web app's `SearchResult` interface (`src/components/search/types.ts`) for potential future integration.

### LinkedIn ToS Warning

Before the first sourcing run, display a modal or inline warning:

> **Important:** This tool automates interactions with LinkedIn on your behalf. Use of automation tools may violate LinkedIn's User Agreement. By proceeding, you acknowledge that you understand the risks and accept full responsibility for compliance with LinkedIn's terms of service. Apply Codes is not liable for any account restrictions or penalties.

Store acknowledgment in `chrome.storage.local` as `linkedinAutomationTosAccepted: true`.

### Testing Approach

Since this is a plain JavaScript Chrome extension (not TypeScript, no build step), testing is manual:

1. Load the extension unpacked in Chrome.
2. Navigate to each of the three LinkedIn dashboard types.
3. Run sourcing with test criteria on each dashboard.
4. Verify candidate extraction, table display, and export for each.
5. Test the Stop button mid-run.
6. Test SPA navigation (navigate away and back during a run).
7. Test persistence (close tab, reopen, verify stored results).
8. Test Cloud Function integration (boolean generation, candidate analysis).
9. Verify the existing profile page sidebar (`/in/*`) still works after the new content scripts are added.
