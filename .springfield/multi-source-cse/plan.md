# Multi-Source Candidate Search Platform — Implementation Plan

**Created:** 2026-03-06
**Status:** Ready for implementation
**Migration:** Google CSE -> Serper.dev with 6-source expansion

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [TypeScript Interfaces](#2-typescript-interfaces)
3. [Serper.dev API Integration Details](#3-serperdev-api-integration-details)
4. [Ordered Subtasks](#4-ordered-subtasks)
5. [File-by-File Change Descriptions](#5-file-by-file-change-descriptions)
6. [Success Criteria Checklist](#6-success-criteria-checklist)

---

## 1. Architecture Overview

### Current State (What We're Replacing)

The current search pipeline has **three parallel CSE code paths** that all need migration:

1. **`MinimalSearchForm.tsx` (lines 871-967)** — Primary path. Calls `functionBridge.getGoogleCseKey()` to get the API key, then makes a **direct browser-side `fetch()` to Google CSE API** with `site:linkedin.com/in/` hardcoded. This is the critical security issue: the API key is exposed to the browser.

2. **`src/components/search/hooks/google-search/searchApi.ts`** — Secondary path used by the search hooks system. Also calls `functionBridge.getGoogleCseKey()` and makes browser-side CSE requests. Includes more sophisticated result parsing (name extraction, job title patterns).

3. **`functions/linkedin-search.js`** — Backend cloud function path. Uses Gemini for boolean query generation, then calls CSE server-side. This is the only path that keeps the API key server-side, but it's LinkedIn-only.

### Target State

```
Browser                          Cloud Functions                    External
┌──────────────┐    onCall v2    ┌─────────────────────┐           ┌──────────┐
│ MinimalSearch │ ──────────────>│ candidateSearch.js   │──────────>│ Serper   │
│ Form.tsx      │                │                      │  POST x6  │ .dev API │
│              │                │  - Validate auth      │<──────────│          │
│ SourceSelect │                │  - Build site: queries│           └──────────┘
│ or.tsx       │                │  - Promise.allSettled │
│              │<───────────────│  - Parse & normalize  │           ┌──────────┐
│ Results with │  categorized   │  - Score & rank       │──────────>│ Firestore│
│ source tabs  │  results       │  - Cache results      │  cache    │ (cache)  │
└──────────────┘                └─────────────────────┘           └──────────┘
```

**Key principle:** Zero API keys exposed to the browser. All Serper.dev calls happen server-side.

---

## 2. TypeScript Interfaces

### Shared Types (new file: `src/types/candidate-search.ts`)

```typescript
/**
 * Sources available for candidate search.
 * Each source maps to a specific site: restriction in the Serper.dev query.
 */
export type CandidateSource =
  | 'linkedin'
  | 'indeed'
  | 'github'
  | 'stackoverflow'
  | 'glassdoor'
  | 'behance'
  | 'dribbble';

/**
 * Configuration for each search source.
 * Used both client-side (for UI) and server-side (for query building).
 */
export interface SourceConfig {
  id: CandidateSource;
  label: string;
  siteRestriction: string;
  excludeTerms?: string[];
  /** Some sources (behance, dribbble) are portfolio-only */
  isPortfolio: boolean;
  /** Whether Nymeria enrichment is supported for this source */
  enrichmentSupported: boolean;
  icon: string; // lucide icon name
  color: string; // tailwind color class for badge
}

/**
 * Request payload sent from frontend to candidateSearch cloud function.
 */
export interface CandidateSearchRequest {
  keywords: string;
  sources: CandidateSource[];
  location?: string;
  experienceLevel?: string;
  page?: number;
  resultsPerSource?: number; // default 10, max 20
  useAIGeneration?: boolean;
}

/**
 * A single normalized candidate result from any source.
 */
export interface CandidateResult {
  id: string; // `${source}-${hash}`
  source: CandidateSource;
  name: string;
  title: string;
  company: string;
  location: string;
  profileUrl: string;
  snippet: string;
  skills: string[];
  matchScore: number; // 0-1
  searchRank: number;
  /** Raw Serper position within source results */
  serperPosition: number;
  /** Source-specific metadata */
  meta: {
    // LinkedIn: headline, connections
    // GitHub: repos, stars, language
    // StackOverflow: reputation, tags
    // Behance/Dribbble: project count, appreciations
    [key: string]: any;
  };
}

/**
 * Results for a single source within the search response.
 */
export interface SourceSearchResult {
  source: CandidateSource;
  results: CandidateResult[];
  totalEstimated: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
  /** Time taken for this source's Serper request (ms) */
  latencyMs: number;
}

/**
 * Complete response from the candidateSearch cloud function.
 */
export interface CandidateSearchResponse {
  success: boolean;
  data: {
    sources: SourceSearchResult[];
    /** All results merged and sorted by matchScore */
    merged: CandidateResult[];
    metadata: {
      totalFound: number;
      sourcesQueried: CandidateSource[];
      sourcesSucceeded: CandidateSource[];
      sourcesFailed: CandidateSource[];
      page: number;
      keywords: string;
      location?: string;
      experienceLevel?: string;
      booleanQuery: string;
      searchTime: string;
      /** Firestore cache key if results were cached */
      cacheKey?: string;
      cached: boolean;
    };
  };
  error?: string;
}

/**
 * Firestore cache document structure.
 * Collection: `search_cache`
 */
export interface SearchCacheDocument {
  cacheKey: string; // SHA-256 of normalized query params
  query: {
    keywords: string;
    sources: CandidateSource[];
    location?: string;
    experienceLevel?: string;
    page: number;
  };
  response: CandidateSearchResponse;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp; // createdAt + 24h for LinkedIn, 72h for others
  hitCount: number;
}
```

### Source Configuration Constants (shared between frontend and backend)

```typescript
export const SOURCE_CONFIGS: Record<CandidateSource, SourceConfig> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    siteRestriction: 'site:linkedin.com/in/',
    isPortfolio: false,
    enrichmentSupported: true,
    icon: 'Linkedin',
    color: 'bg-blue-600',
  },
  indeed: {
    id: 'indeed',
    label: 'Indeed',
    siteRestriction: 'site:indeed.com/r/',
    isPortfolio: false,
    enrichmentSupported: false,
    icon: 'Briefcase',
    color: 'bg-indigo-500',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    siteRestriction: 'site:github.com',
    excludeTerms: ['-orgs', '-topics', '-marketplace', '-trending', '-explore'],
    isPortfolio: false,
    enrichmentSupported: false,
    icon: 'Code',
    color: 'bg-gray-800',
  },
  stackoverflow: {
    id: 'stackoverflow',
    label: 'Stack Overflow',
    siteRestriction: 'site:stackoverflow.com/users/',
    isPortfolio: false,
    enrichmentSupported: false,
    icon: 'MessageSquare',
    color: 'bg-orange-500',
  },
  glassdoor: {
    id: 'glassdoor',
    label: 'Glassdoor',
    siteRestriction: 'site:glassdoor.com/member/',
    isPortfolio: false,
    enrichmentSupported: false,
    icon: 'Building',
    color: 'bg-green-600',
  },
  behance: {
    id: 'behance',
    label: 'Behance',
    siteRestriction: 'site:behance.net',
    isPortfolio: true,
    enrichmentSupported: false,
    icon: 'Palette',
    color: 'bg-blue-500',
  },
  dribbble: {
    id: 'dribbble',
    label: 'Dribbble',
    siteRestriction: 'site:dribbble.com',
    isPortfolio: true,
    enrichmentSupported: false,
    icon: 'Paintbrush',
    color: 'bg-pink-500',
  },
};

export const DEFAULT_SOURCES: CandidateSource[] = ['linkedin', 'indeed', 'github'];
```

---

## 3. Serper.dev API Integration Details

### API Specification

```
Endpoint: POST https://google.serper.dev/search
Headers:
  X-API-KEY: <SERPER_API_KEY>
  Content-Type: application/json

Request Body:
{
  "q": "site:linkedin.com/in/ software engineer react",
  "gl": "us",           // country code
  "location": "Austin, Texas",  // optional, free-form string
  "num": 10,            // results per page (max 100)
  "page": 1             // page number
}

Response:
{
  "searchParameters": { "q": "...", "gl": "us", "location": "...", "num": 10, "page": 1 },
  "organic": [
    {
      "title": "John Smith - Senior Software Engineer - LinkedIn",
      "link": "https://www.linkedin.com/in/johnsmith",
      "snippet": "Senior Software Engineer at Google. Experience with React, Node.js...",
      "position": 1,
      "date": "2024-01-15"  // when indexed (not always present)
    }
  ],
  "searchInformation": {
    "totalResults": 15400
  }
}
```

### Key Differences from Google CSE

| Feature | Google CSE | Serper.dev |
|---------|-----------|------------|
| Auth | API key + Engine ID in URL params | Single API key in header |
| Results per request | Max 10 | Max 100 |
| Pagination | `start` index (1-based) | `page` number (1-based) |
| Response key | `items[]` | `organic[]` |
| Site restriction | CSE config OR query param | Only via `site:` in query |
| Rate limit | 100/day free, 10K/day paid | 2,500/month free, then per-query |
| Pricing | $5/1000 queries | $50/month for 5K queries |

### Per-Source Query Construction

For each source, the cloud function builds the query as:

```javascript
function buildSerperQuery(booleanQuery, source, location) {
  const config = SOURCE_CONFIGS[source];
  let q = `${config.siteRestriction} ${booleanQuery}`;

  // Add exclusion terms (e.g., GitHub non-profile pages)
  if (config.excludeTerms) {
    q += ' ' + config.excludeTerms.join(' ');
  }

  return {
    q,
    gl: 'us',
    num: 10,
    ...(location ? { location } : {}),
  };
}
```

### Parallel Execution Pattern

```javascript
const sourcePromises = request.sources.map(source => {
  const query = buildSerperQuery(booleanQuery, source, request.location);
  return executeSerperSearch(query, source)
    .then(results => ({ source, status: 'fulfilled', results }))
    .catch(error => ({ source, status: 'rejected', error: error.message, results: [] }));
});

const results = await Promise.allSettled(sourcePromises);
```

### Caching Strategy

- **Cache key**: SHA-256 hash of `JSON.stringify({ keywords (normalized), sources (sorted), location (lowercased), experienceLevel, page })`
- **TTL**: 24 hours for LinkedIn (data changes frequently), 72 hours for all other sources
- **Collection**: `search_cache` in Firestore
- **Cache check**: Before executing Serper requests, check Firestore for unexpired cache hit
- **Cache write**: After successful search, write results to Firestore asynchronously (don't block response)
- **Cache invalidation**: TTL-based only; no manual invalidation needed

### Error Handling

```javascript
// Serper.dev error codes
// 401: Invalid API key
// 429: Rate limit exceeded (retry after backoff)
// 500: Serper internal error (retry once)

const RETRY_CONFIG = {
  maxRetries: 1,
  retryDelay: 1000,
  retryOn: [429, 500, 502, 503],
};
```

---

## 4. Ordered Subtasks

### Phase 1: Foundation (No UI changes, no breaking changes)

#### Task 1.1: Create shared type definitions
- **File**: `src/types/candidate-search.ts` (NEW)
- **Dependencies**: None
- **Work**: Create all TypeScript interfaces and source config constants defined in Section 2
- **Verify**: `npx tsc --noEmit src/types/candidate-search.ts`

#### Task 1.2: Set SERPER_API_KEY in Firebase Functions environment
- **Dependencies**: Serper.dev account created
- **Work**: `firebase functions:secrets:set SERPER_API_KEY`
- **Verify**: `firebase functions:secrets:access SERPER_API_KEY`

#### Task 1.3: Create `functions/utils/serper.js` utility module
- **File**: `functions/utils/serper.js` (NEW)
- **Dependencies**: Task 1.2
- **Work**:
  - Export `executeSerperSearch(query, options)` function
  - Implements retry logic (1 retry on 429/5xx)
  - 15-second timeout per request
  - Returns normalized `{ organic, searchInformation, latencyMs }`
  - Follows the lazy-init singleton pattern from `functions/utils/sendgrid.js`
- **Verify**: `node -e "const s = require('./functions/utils/serper'); console.log(typeof s.executeSerperSearch)"`

#### Task 1.4: Create `functions/utils/search-cache.js` utility module
- **File**: `functions/utils/search-cache.js` (NEW)
- **Dependencies**: None
- **Work**:
  - Export `getCachedResults(cacheKey)` — reads from `search_cache` collection, checks TTL
  - Export `setCachedResults(cacheKey, data, ttlHours)` — writes to `search_cache` collection
  - Export `generateCacheKey(params)` — SHA-256 of normalized query params
  - Uses `firebase-admin/firestore`
- **Verify**: `node -e "const c = require('./functions/utils/search-cache'); console.log(typeof c.generateCacheKey)"`

### Phase 2: Backend — New Cloud Function

#### Task 2.1: Create `functions/candidate-search.js` cloud function
- **File**: `functions/candidate-search.js` (NEW)
- **Dependencies**: Tasks 1.1, 1.3, 1.4
- **Work**:
  - `onCall` v2, `timeoutSeconds: 120`, `memory: '512MiB'`
  - Auth required
  - Input validation: keywords required, sources array validated against allowed list
  - Step 1: Check cache (`search-cache.getCachedResults`)
  - Step 2: Generate boolean query (reuse `generateAIBooleanQuery` from `linkedin-search.js` or fall back to basic)
  - Step 3: Build per-source Serper queries using `SOURCE_CONFIGS`
  - Step 4: Execute parallel searches with `Promise.allSettled`
  - Step 5: Parse results per source using source-specific parsers
  - Step 6: Calculate match scores (adapted from `linkedin-search.js:calculateMatchScores`)
  - Step 7: Merge and sort all results
  - Step 8: Cache results asynchronously
  - Step 9: Return `CandidateSearchResponse`
- **Parsers needed** (internal functions):
  - `parseLinkedInResult(item)` — adapted from existing `formatLinkedInResults`
  - `parseIndeedResult(item)` — extract name, title, company from Indeed resume URLs
  - `parseGitHubResult(item)` — extract username, bio, repos from GitHub profile pages
  - `parseStackOverflowResult(item)` — extract display name, reputation, top tags
  - `parseGlassdoorResult(item)` — extract member name, company, title
  - `parsePortfolioResult(item, source)` — generic for Behance/Dribbble
- **Verify**: `cd functions && node -e "const f = require('./candidate-search'); console.log(typeof f.candidateSearch)"`

#### Task 2.2: Register in `functions/index.js`
- **File**: `functions/index.js` (MODIFY)
- **Dependencies**: Task 2.1
- **Work**: Add `exports.candidateSearch = require('./candidate-search').candidateSearch;`
- **Verify**: `cd functions && node -e "require('./index')"` (existing verify command from CLAUDE.md)

#### Task 2.3: Deploy and smoke test
- **Dependencies**: Tasks 2.1, 2.2
- **Work**: `firebase deploy --only functions:candidateSearch`
- **Verify**: Call function from Firebase console or curl with auth token; confirm results from at least LinkedIn and GitHub sources

### Phase 3: Frontend — New Components

#### Task 3.1: Create `src/components/search/SourceSelector.tsx`
- **File**: `src/components/search/SourceSelector.tsx` (NEW)
- **Dependencies**: Task 1.1
- **Work**:
  - Multi-select pill toggle component
  - Props: `{ selectedSources: CandidateSource[], onSourcesChange: (sources: CandidateSource[]) => void, disabled?: boolean }`
  - Renders a row of clickable pill badges, one per source from `SOURCE_CONFIGS`
  - Each pill shows icon + label + selected state
  - Color-coded per source config
  - "Select All" / "Deselect All" toggle
  - Default selection: `DEFAULT_SOURCES` (linkedin, indeed, github)
  - Responsive: wraps on mobile, horizontal scroll on very small screens
- **Verify**: `npm run build` (type-checks during build)

#### Task 3.2: Create `src/components/search/SourceBadge.tsx`
- **File**: `src/components/search/SourceBadge.tsx` (NEW)
- **Dependencies**: Task 1.1
- **Work**:
  - Small badge component showing source icon + label
  - Props: `{ source: CandidateSource, size?: 'sm' | 'md' }`
  - Used in search result cards to indicate which source a result came from
- **Verify**: `npm run build`

#### Task 3.3: Create `src/components/search/SourceTabs.tsx`
- **File**: `src/components/search/SourceTabs.tsx` (NEW)
- **Dependencies**: Task 1.1
- **Work**:
  - Tab bar for filtering results by source
  - Tabs: "All" + one tab per source that returned results
  - Each tab shows count badge
  - Props: `{ sources: SourceSearchResult[], activeTab: CandidateSource | 'all', onTabChange: (tab) => void }`
- **Verify**: `npm run build`

### Phase 4: Frontend — Integration

#### Task 4.1: Add `candidateSearch` to `function-bridge.ts`
- **File**: `src/lib/function-bridge.ts` (MODIFY)
- **Dependencies**: Task 1.1
- **Work**:
  - Add import for `CandidateSearchRequest` and `CandidateSearchResponse` from `src/types/candidate-search`
  - Add method: `async candidateSearch(payload: CandidateSearchRequest): Promise<CandidateSearchResponse>`
  - Implementation: `return this.callCallable('candidateSearch', payload);`
- **Verify**: `npm run build`

#### Task 4.2: Update `MinimalSearchForm.tsx` — Replace CSE with candidateSearch
- **File**: `src/components/MinimalSearchForm.tsx` (MODIFY)
- **Dependencies**: Tasks 3.1, 3.2, 3.3, 4.1
- **Work**:
  - **Add imports**: `SourceSelector`, `SourceBadge`, `SourceTabs`, types from `candidate-search.ts`
  - **Add state**:
    ```typescript
    const [selectedSources, setSelectedSources] = useState<CandidateSource[]>(DEFAULT_SOURCES);
    const [activeSourceTab, setActiveSourceTab] = useState<CandidateSource | 'all'>('all');
    const [sourceResults, setSourceResults] = useState<SourceSearchResult[]>([]);
    ```
  - **Replace `searchGoogle` function** (lines 871-967):
    - Remove `functionBridge.getGoogleCseKey()` call
    - Remove direct `fetch()` to `googleapis.com/customsearch/v1`
    - Replace with `functionBridge.candidateSearch({ keywords: booleanString, sources: selectedSources, location, experienceLevel, page })`
    - Map `CandidateSearchResponse.data.merged` to the existing `SearchResult[]` interface for backward compatibility with result display, enrichment, analysis, etc.
    - Store `sourceResults` for tab filtering
  - **Add `SourceSelector`** in the UI between the boolean string section and the search button
  - **Add `SourceTabs`** above search results list
  - **Update result cards**: Add `SourceBadge` to each result card
  - **Update `SearchResult` interface** (local, lines 45-52): Add `source?: CandidateSource` field
  - **Filter logic**: When `activeSourceTab !== 'all'`, filter `searchResults` by source
  - **Enrichment gating**: Only show "Enrich" button when `result.source === 'linkedin'`
  - **Pagination**: Update `loadMoreResults` to pass `page` to candidateSearch
  - **Remove**: All references to `getGoogleCseKey`, all direct CSE API URLs
- **Verify**: `npm run build && npm run dev` (manual test in browser)

#### Task 4.3: Update CSV export — Add source column
- **File**: `src/components/MinimalSearchForm.tsx` (MODIFY, within `exportSelectedToCSV`)
- **Dependencies**: Task 4.2
- **Work**:
  - Add 'Source' to CSV headers array (line 1014)
  - Add `r.source || 'LinkedIn'` to each CSV row (after Name column)
  - Updated headers: `['Name', 'Source', 'Title/Role', 'Company', 'Location', 'Profile URL', 'Snippet', 'Email', 'Phone']`
- **Verify**: Manual test — export CSV after multi-source search, confirm Source column populated

#### Task 4.4: Update `searchApi.ts` to use candidateSearch
- **File**: `src/components/search/hooks/google-search/searchApi.ts` (MODIFY)
- **Dependencies**: Task 4.1
- **Work**:
  - Replace `fetchSearchResults` implementation to call `functionBridge.candidateSearch`
  - Remove all `getGoogleCseKey()` calls
  - Remove direct CSE API URL construction
  - Map `CandidateSearchResponse` to existing `GoogleSearchResult` shape for backward compatibility
  - This ensures any code paths using the hooks system also get migrated
- **Verify**: `npm run build`

### Phase 5: Cleanup & Deprecation

#### Task 5.1: Deprecate `functions/get-google-cse-key.js`
- **File**: `functions/get-google-cse-key.js` (MODIFY)
- **File**: `functions/index.js` (MODIFY)
- **Dependencies**: Tasks 4.2, 4.4 (all callers migrated)
- **Work**:
  - Add deprecation warning log in `get-google-cse-key.js`: `logger.warn('DEPRECATED: getGoogleCseKey is deprecated. Use candidateSearch instead.')`
  - Add `@deprecated` JSDoc annotation
  - Do NOT remove yet — keep for rollback safety for 2 weeks
  - Remove `getGoogleCseKey` method from `function-bridge.ts`
- **Verify**: `grep -r "getGoogleCseKey" src/` returns 0 results (only in function-bridge.ts declaration, now removed)

#### Task 5.2: Deprecate `functions/linkedin-search.js`
- **File**: `functions/linkedin-search.js` (MODIFY)
- **File**: `functions/index.js` (MODIFY)
- **Dependencies**: Task 4.2
- **Work**:
  - Add deprecation warning log
  - Add `@deprecated` JSDoc annotation
  - Do NOT remove yet — keep for rollback safety
  - Remove `linkedinSearch` method from `function-bridge.ts`
- **Verify**: `grep -r "linkedinSearch\|linkedin-search" src/` returns 0 relevant hits

#### Task 5.3: Remove CSE environment variables (after 2-week deprecation period)
- **Dependencies**: Tasks 5.1, 5.2 deployed for 2+ weeks
- **Work**:
  - Remove `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` from Firebase Functions env
  - Delete `functions/get-google-cse-key.js`
  - Delete `functions/linkedin-search.js`
  - Remove exports from `functions/index.js`
- **Verify**: `firebase deploy --only functions` succeeds; no runtime errors in Cloud Functions logs

### Phase 6: Polish & Production Readiness

#### Task 6.1: Add source-specific result card layouts
- **File**: `src/components/MinimalSearchForm.tsx` (MODIFY, result rendering section ~lines 2130-2590)
- **Dependencies**: Task 4.2
- **Work**:
  - LinkedIn results: Show name, title, company, location (existing layout)
  - GitHub results: Show username, bio, top language, repo count
  - Stack Overflow results: Show display name, reputation, top tags
  - Behance/Dribbble results: Show as portfolio cards with different visual treatment
  - Indeed results: Show name, title, location, experience summary
  - Glassdoor results: Show member name, company, title
  - Use conditional rendering based on `result.source`
- **Verify**: Manual browser test with multi-source results

#### Task 6.2: Add error handling for partial source failures
- **File**: `src/components/MinimalSearchForm.tsx` (MODIFY)
- **Dependencies**: Task 4.2
- **Work**:
  - When some sources fail but others succeed, show results with a warning banner
  - Banner: "Some sources failed: [GitHub, Stack Overflow]. Results shown from: [LinkedIn, Indeed]"
  - Use `CandidateSearchResponse.data.metadata.sourcesFailed` to drive this
- **Verify**: Manual test — disconnect one source (invalid site restriction) and verify partial results display

#### Task 6.3: Add search analytics tracking
- **File**: `src/components/MinimalSearchForm.tsx` (MODIFY)
- **Dependencies**: Task 4.2
- **Work**:
  - Update `trackCandidateSearch` call (currently at line 946) to include sources info
  - Track: `trackCandidateSearch('serper_multi', totalResults, { sources: selectedSources.join(','), sourcesSucceeded, sourcesFailed, cached })`
- **Verify**: Check analytics events in browser dev tools

---

## 5. File-by-File Change Descriptions

### New Files

| File | Type | Description |
|------|------|-------------|
| `src/types/candidate-search.ts` | Types | All shared TypeScript interfaces, source configs, defaults |
| `functions/utils/serper.js` | Utility | Serper.dev API client with retry logic, timeout, error mapping |
| `functions/utils/search-cache.js` | Utility | Firestore cache read/write/key-generation for search results |
| `functions/candidate-search.js` | Cloud Function | Main onCall v2 function: orchestrates multi-source search |
| `src/components/search/SourceSelector.tsx` | Component | Multi-select pill toggles for source selection |
| `src/components/search/SourceBadge.tsx` | Component | Small badge showing source icon + name |
| `src/components/search/SourceTabs.tsx` | Component | Tab bar for filtering results by source |

### Modified Files

| File | Changes |
|------|---------|
| `functions/index.js` | Add `candidateSearch` export; deprecation comments on `linkedinSearch` and `getGoogleCseKey` |
| `src/lib/function-bridge.ts` | Add `candidateSearch()` method; remove `getGoogleCseKey()` and `linkedinSearch()` methods |
| `src/components/MinimalSearchForm.tsx` | Replace `searchGoogle()` with `candidateSearch` call; add source selection state; add source tabs; update result cards with source badges; gate enrichment to LinkedIn-only; add source to CSV export |
| `src/components/search/hooks/google-search/searchApi.ts` | Replace CSE `fetchSearchResults` with candidateSearch wrapper |
| `functions/get-google-cse-key.js` | Add deprecation warning (Phase 5, then delete in Phase 6) |
| `functions/linkedin-search.js` | Add deprecation warning (Phase 5, then delete in Phase 6) |

### Untouched Files (Confirmed No Changes Needed)

| File | Reason |
|------|--------|
| `src/components/search/hooks/google-search/utils.ts` | Location extraction logic still useful; will be imported by new parsers |
| `src/components/search/hooks/google-search/types.ts` | Kept for backward compatibility during transition; new types in `candidate-search.ts` |
| `src/components/search/CompactCandidateAnalysis.tsx` | Analysis component is source-agnostic; no changes needed |
| `functions/utils/gemini.js` | Boolean generation reused as-is in `candidate-search.js` |
| `functions/utils/nymeria.js` | Enrichment unchanged; gated to LinkedIn results only in frontend |

---

## 6. Success Criteria Checklist

### Functional Requirements

- [ ] **F1**: User can select 1-6 sources via pill toggles before searching
- [ ] **F2**: Search executes against all selected sources in parallel via single cloud function call
- [ ] **F3**: Results display with source badges on each card
- [ ] **F4**: Results can be filtered by source via tab bar (All + per-source)
- [ ] **F5**: LinkedIn results support enrichment (Nymeria); other sources show enrichment as disabled
- [ ] **F6**: GitHub results display username, bio, language info
- [ ] **F7**: Stack Overflow results display reputation and tags
- [ ] **F8**: Behance/Dribbble results display as portfolio cards
- [ ] **F9**: CSV export includes Source column
- [ ] **F10**: Pagination works across multi-source results
- [ ] **F11**: Partial failures (some sources fail) show results from successful sources with warning
- [ ] **F12**: Results are cached in Firestore (24h LinkedIn, 72h others)
- [ ] **F13**: Cached results are returned without hitting Serper.dev API

### Security Requirements

- [ ] **S1**: No API keys (Serper, CSE, or otherwise) are ever sent to the browser
- [ ] **S2**: `getGoogleCseKey` cloud function is deprecated and no longer called
- [ ] **S3**: All Serper.dev requests happen server-side in the cloud function
- [ ] **S4**: Authentication is required for the `candidateSearch` cloud function

### Performance Requirements

- [ ] **P1**: Multi-source search completes in < 8 seconds (6 parallel Serper calls)
- [ ] **P2**: Cached results return in < 500ms
- [ ] **P3**: Cloud function memory stays within 512MiB allocation
- [ ] **P4**: No browser-side network requests to any search API

### Migration Requirements

- [ ] **M1**: `getGoogleCseKey` function is not called anywhere in `src/` directory
- [ ] **M2**: `linkedinSearch` function is not called anywhere in `src/` directory
- [ ] **M3**: No references to `googleapis.com/customsearch` remain in `src/` directory
- [ ] **M4**: `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` env vars can be removed after deprecation period
- [ ] **M5**: Existing boolean generation (Gemini AI) continues to work with new search
- [ ] **M6**: Existing features (analysis, enrichment, batch operations, save candidates) all work with new search results

### Verify Commands (Run After Each Phase)

```bash
# Phase 1: Types compile
npx tsc --noEmit src/types/candidate-search.ts

# Phase 2: Functions load without error
cd functions && node -e "require('./index')"

# Phase 3: Frontend builds
npm run build

# Phase 4: No CSE references in frontend
grep -r "getGoogleCseKey\|googleapis.com/customsearch\|GOOGLE_CSE" src/ | grep -v node_modules | grep -v '.d.ts'
# Should return 0 results

# Phase 5: Deprecated functions still load (for rollback)
cd functions && node -e "require('./index')"

# Full regression
npm test
npm run build
```

---

## Appendix: Risk Mitigation

### LinkedIn X-Ray Degradation (Dec 2023+)
Google no longer indexes LinkedIn headlines, skills, or detailed experience. The parser must handle:
- Title field often just "Name - LinkedIn" (no job title)
- Snippet may be generic "View Name's profile on LinkedIn..."
- Mitigation: Lower confidence scores for sparse LinkedIn results; surface enrichment CTA prominently

### Serper.dev Rate Limits
- Free tier: 2,500 queries/month
- Each multi-source search = N queries (where N = number of selected sources)
- 6-source search = 6 queries per user search
- Mitigation: Firestore caching (24-72h TTL) dramatically reduces redundant queries
- Budget: At $50/month for 5K queries, this supports ~830 full 6-source searches/month

### Location Filtering Accuracy
- Google's `site:` search with location terms has 50-70% accuracy
- Mitigation: Pass location to Serper.dev's `location` parameter (helps slightly), but treat location as a soft filter
- Future: Add post-search location filtering using enrichment data

### Rollback Plan
- Keep `get-google-cse-key.js` and `linkedin-search.js` deployed (deprecated but functional) for 2 weeks
- If Serper.dev has outages, can temporarily revert `MinimalSearchForm.tsx` to use CSE path
- Feature flag option: Add `VITE_USE_SERPER=true` env var to control which path is used during transition
