# PROMPT.md -- Multi-Source CSE Candidate Search Platform

## Task Definition

Refactor the existing LinkedIn-only Google Custom Search Engine (CSE) integration into a multi-source candidate search platform. The current system searches only `site:linkedin.com/in/` via a single CSE. The goal is to support x-ray searching across LinkedIn, Indeed, GitHub, Glassdoor, Monster, ZipRecruiter, CareerBuilder, and other resume/profile databases -- all from the same Sourcing page UI with source selection, categorized results, and unified filter/sort/export/analyze functionality.

Additionally, rotate the exposed API key and secure the new key properly.

## Current Architecture (As-Is)

### Cloud Functions
- **`functions/get-google-cse-key.js`** -- `onCall` function that returns `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` from env vars to the frontend.
- **`functions/linkedin-search.js`** -- `onCall` function with Gemini-powered boolean query generation, Google CSE execution (`site:linkedin.com/in/`), LinkedIn profile parsing, match scoring, and pagination. Currently NOT used by the main UI flow (the frontend calls CSE directly).

### Frontend
- **`src/components/MinimalSearchForm.tsx`** -- The primary search UI. Calls `functionBridge.getGoogleCseKey()` to get credentials, then makes direct `fetch()` calls to Google CSE API with `site:linkedin.com/in/` hardcoded into the query string. Handles pagination (max 10 pages of 10), result mapping, location extraction, profile enrichment, batch analysis, export, email generation.
- **`src/components/search/hooks/google-search/searchApi.ts`** -- Secondary search API module with `fetchSearchResults()` and `processSearchResults()`. Also calls CSE directly from frontend with `site:linkedin.com/in/` via `prepareSearchString()`.
- **`src/components/SearchResults.tsx`** -- Older Firestore-based results table (reads from `search_results` collection).
- **`src/pages/Sourcing.tsx`** -- Dashboard page with stats, quick actions, recent searches, and lazy-loaded `MinimalSearchForm`.

### Key Details
- GCP Project: `applycodes-2683f`
- CSE ID hardcoded fallback: `b28705633bcb44cf0`
- The frontend exposes the CSE API key to the browser (retrieved via cloud function, then used in client-side fetch)
- Location search uses Google Places Text Search API via `functions/location-search.js`
- Boolean generation uses Gemini AI (`functions/utils/gemini.js` with `getModel()`)

---

## Platform-Specific X-Ray Search Patterns

X-ray searching uses Google's `site:` operator to search within a specific domain. Each platform has unique URL structures and content patterns that affect how queries should be constructed.

### 1. LinkedIn (Existing)
```
site:linkedin.com/in/ "software engineer" "python" "San Francisco"
```
- **Profile URL pattern**: `linkedin.com/in/{username}`
- **Title format**: `Name | Title at Company | LinkedIn`
- **Snippet contains**: headline, current role, location, summary excerpt
- **Location data**: Available in `og:description` metatag and snippet ("City, State Area")
- **Limitations**: LinkedIn aggressively blocks scraping; CSE results are best available public data
- **Tips**: Use `/in/` to target personal profiles, exclude `/company/` and `/jobs/`

### 2. Indeed
```
site:indeed.com/r/ "software engineer" "python" "San Francisco"
```
- **Resume URL pattern**: `indeed.com/r/{resumeId}` (public resumes)
- **Alternative patterns**:
  - `site:indeed.com/resume/ "keyword"` (resume search pages)
  - `site:my.indeed.com/p/ "keyword"` (older profile format)
- **Title format**: `Name - City, State | Indeed.com`
- **Snippet contains**: skills, experience summary, job titles, education
- **Location data**: Typically in title and first line of snippet
- **Tips**: Indeed resumes are opt-in public; smaller pool than LinkedIn but higher intent candidates

### 3. GitHub
```
site:github.com "software engineer" "python" "San Francisco" -site:github.com/orgs -site:github.com/topics
```
- **Profile URL pattern**: `github.com/{username}` (no path after username)
- **Title format**: `username (Display Name) | GitHub` or `username | GitHub`
- **Snippet contains**: bio, pinned repos, contribution activity, README content
- **Location data**: User bio often includes location; not structured
- **Exclusion patterns**: Add `-site:github.com/orgs -site:github.com/topics -site:github.com/marketplace` to avoid non-profile pages
- **Tips**: Best for technical/developer roles. Search for specific technologies, frameworks, and open-source contributions. Combine with `"available for hire"` or `"open to work"` for active seekers.
- **Special queries**:
  - `site:github.com "available for hire" "react" "typescript"` -- active job seekers
  - `site:github.com/sponsors "machine learning"` -- developers with sponsor profiles (often senior)

### 4. Glassdoor
```
site:glassdoor.com/member/ "software engineer" "python"
```
- **Profile URL pattern**: `glassdoor.com/member/{userId}` (limited public profiles)
- **Alternative**: `site:glassdoor.com/Reviews/ "company name"` (for company research, not candidate sourcing)
- **Snippet contains**: job title, company, review snippets
- **Location data**: Sometimes in review context
- **Limitations**: Glassdoor heavily gates content behind login. X-ray results are sparse. Most useful for understanding candidate sentiment at target companies rather than direct sourcing.
- **Tips**: Lower priority source. Best used as supplementary intelligence, not primary sourcing.

### 5. Monster
```
site:monster.com/profile/ "software engineer" "python" "San Francisco"
```
- **Resume URL pattern**: `monster.com/profile/{username}` (public profiles)
- **Alternative**: `site:monster.com/resume/ "keyword"`
- **Title format**: `Name - City, State | Monster`
- **Snippet contains**: objective, skills, recent experience
- **Location data**: Usually in title
- **Tips**: Declining platform but still has resumes especially for non-tech roles, healthcare, manufacturing, administrative. Good for diversity of candidate pool.

### 6. ZipRecruiter
```
site:ziprecruiter.com/profile/ "software engineer" "python" "San Francisco"
```
- **Resume URL pattern**: `ziprecruiter.com/profile/{userId}`
- **Alternative**: Public candidate profiles are limited; many are behind auth
- **Snippet contains**: job title, skills, location
- **Location data**: Usually in snippet and title
- **Tips**: Smaller indexed pool than Indeed/Monster. Better for hourly and SMB roles.

### 7. CareerBuilder
```
site:careerbuilder.com/profile/ "software engineer" "python"
```
- **Resume URL pattern**: `careerbuilder.com/profile/{userId}`
- **Snippet contains**: resume headline, skills, location
- **Location data**: In title and snippet
- **Tips**: Similar to Monster -- declining but still relevant for certain verticals (healthcare, admin, manufacturing).

### 8. Stack Overflow / Stack Overflow Talent (Bonus)
```
site:stackoverflow.com/users/ "python" "machine learning"
```
- **Profile URL pattern**: `stackoverflow.com/users/{id}/{username}`
- **Snippet contains**: reputation, tags, bio, location
- **Location data**: Often in user bio
- **Tips**: Excellent for developer sourcing. Reputation score is a quality signal. Combine with tag-specific searches.

### 9. Xing (European Market - Bonus)
```
site:xing.com/profile/ "software engineer" "Berlin"
```
- **Profile URL pattern**: `xing.com/profile/{username}`
- **Tips**: Primary professional network in DACH region (Germany, Austria, Switzerland). Important for European sourcing.

### 10. Behance / Dribbble (Design Roles - Bonus)
```
site:behance.net "UX designer" "San Francisco"
site:dribbble.com "product designer" "remote"
```
- **Tips**: Essential for design roles. Portfolio-first platforms with public profiles.

---

## CSE Configuration Strategy

### Recommended: Single CSE with Dynamic `siteSearch` Parameter

Use ONE Google Custom Search Engine configured to search the entire web, then control which sites are searched via the `siteSearch` and `siteSearchFilter` query parameters at request time.

**Why single CSE over multiple CSEs:**
- Google allows max 10 CSEs per project on the free tier
- One CSE ID to manage, one API key to secure
- Dynamic site filtering via API parameters is fully supported
- Easier billing and quota management (100 queries/day free, $5/1000 after)

**CSE Configuration:**
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new CSE with "Search the entire web" enabled
3. Do NOT restrict to specific sites in the CSE config (use API params instead)
4. Note the new CSE ID (cx parameter)

**API Parameter Approach:**
```
GET https://www.googleapis.com/customsearch/v1
  ?key={API_KEY}
  &cx={CSE_ID}
  &q={boolean_query}
  &siteSearch=linkedin.com/in/
  &siteSearchFilter=i        // i = include only this site
  &start={startIndex}
  &num=10
```

For multi-site searches, make parallel requests per source (Google CSE does not support multiple `siteSearch` values in one request). Alternatively, embed `site:` operators in the query string as done today, making one request per source.

**Alternative: `site:` in query string (current approach, simpler)**
```
q=site:linkedin.com/in/ "software engineer" "python"
q=site:indeed.com/r/ "software engineer" "python"
q=site:github.com "software engineer" "python" -orgs -topics
```
This approach is simpler and already proven in the codebase. Each source gets its own CSE request with the appropriate `site:` prefix.

### Recommended approach: Keep `site:` in query string
- No CSE reconfiguration needed beyond creating a new "whole web" CSE
- Each source is just a different `site:` prefix
- Parallel requests per source
- Merge and categorize results on the backend

---

## Cloud Function Architecture

### Phase 1: Refactor `get-google-cse-key.js` into `candidate-search.js`

Move the CSE call from the frontend to a backend cloud function. The current architecture exposes the API key to the browser. The new architecture should keep the key server-side.

**New function: `functions/candidate-search.js`**

```javascript
// onCall v2 function
// Input: { keywords, sources, location, experienceLevel, page, useAIGeneration }
// sources: string[] e.g. ["linkedin", "indeed", "github"]

const SOURCE_CONFIGS = {
  linkedin: {
    siteRestrict: 'site:linkedin.com/in/',
    name: 'LinkedIn',
    parseResult: parseLinkedInResult,
    locationExtractor: extractLinkedInLocation,
  },
  indeed: {
    siteRestrict: 'site:indeed.com/r/',
    name: 'Indeed',
    parseResult: parseIndeedResult,
    locationExtractor: extractIndeedLocation,
  },
  github: {
    siteRestrict: 'site:github.com',
    excludeTerms: '-site:github.com/orgs -site:github.com/topics -site:github.com/marketplace',
    name: 'GitHub',
    parseResult: parseGitHubResult,
    locationExtractor: extractGitHubLocation,
  },
  glassdoor: {
    siteRestrict: 'site:glassdoor.com/member/',
    name: 'Glassdoor',
    parseResult: parseGlassdoorResult,
    locationExtractor: extractGenericLocation,
  },
  monster: {
    siteRestrict: 'site:monster.com/profile/',
    name: 'Monster',
    parseResult: parseMonsterResult,
    locationExtractor: extractGenericLocation,
  },
  ziprecruiter: {
    siteRestrict: 'site:ziprecruiter.com/profile/',
    name: 'ZipRecruiter',
    parseResult: parseZipRecruiterResult,
    locationExtractor: extractGenericLocation,
  },
  careerbuilder: {
    siteRestrict: 'site:careerbuilder.com/profile/',
    name: 'CareerBuilder',
    parseResult: parseCareerBuilderResult,
    locationExtractor: extractGenericLocation,
  },
  stackoverflow: {
    siteRestrict: 'site:stackoverflow.com/users/',
    name: 'Stack Overflow',
    parseResult: parseStackOverflowResult,
    locationExtractor: extractGenericLocation,
  },
};
```

**Flow:**
1. Receive request with `sources[]` array, keywords, location, page
2. Generate boolean query (reuse existing Gemini AI generation, adapted per source)
3. For each selected source, execute a CSE request with the appropriate `site:` prefix
4. Parse results with source-specific parsers
5. Tag each result with its `source` field
6. Merge, score, and return categorized results
7. Paginate per-source (each source has independent page counters)

**Key design decisions:**
- Execute source queries in parallel using `Promise.allSettled()` (one failing source should not block others)
- Return results grouped by source: `{ linkedin: [...], indeed: [...], github: [...] }`
- Each source gets max 10 results per page (CSE limit)
- Total API calls per user search = number of selected sources (be mindful of CSE quota: 10,000/day at $5/1000)

### Phase 2: Deprecate Frontend CSE Calls

- Remove direct `fetch()` calls to `googleapis.com/customsearch/v1` from `MinimalSearchForm.tsx` and `searchApi.ts`
- All CSE calls go through the new `candidate-search` cloud function
- `get-google-cse-key.js` can be deprecated (no longer exposing API key to frontend)
- Keep `functionBridge.candidateSearch()` as the single entry point

### Phase 3: Deprecate `linkedin-search.js`

The existing `linkedin-search.js` duplicates functionality. Merge its best parts (AI boolean generation, match scoring, profile parsing) into the new `candidate-search.js` and remove it.

### Source-Specific Parsing Functions

Each source needs a dedicated result parser because title/snippet formats differ:

```javascript
// LinkedIn: "Name | Title at Company | LinkedIn"
function parseLinkedInResult(item) { /* existing logic from linkedin-search.js */ }

// Indeed: "Name - City, State | Indeed.com"
function parseIndeedResult(item) {
  const name = item.title?.replace(/\s*[\-|]\s*Indeed\.com.*$/i, '').split(/\s*[\-]\s*/)[0];
  // ...
}

// GitHub: "username (Display Name) | GitHub"
function parseGitHubResult(item) {
  const match = item.title?.match(/^(\w+)\s*\(([^)]+)\)/);
  // ...
}

// Generic fallback for other sources
function parseGenericResult(item, sourceName) { /* strip source suffix from title */ }
```

---

## UI Changes

### 1. Source Toggle (Multi-Select)

Add a source selector component above the search form in `MinimalSearchForm.tsx`.

**Component: `SourceSelector`**
```tsx
interface SourceSelectorProps {
  selectedSources: string[];
  onChange: (sources: string[]) => void;
}

// Render as horizontal pill/chip toggles:
// [LinkedIn*] [Indeed] [GitHub] [Monster] [ZipRecruiter] [CareerBuilder] [Glassdoor] [Stack Overflow]
// * = selected (filled), others = outline
// LinkedIn is selected by default
// "Select All" / "Deselect All" convenience buttons
```

**Placement**: Between the boolean string textarea and the Search button in the existing form layout. Should be collapsible under an "Advanced" or "Sources" section to keep the UI clean for users who only want LinkedIn.

**State**: `selectedSources` state in `MinimalSearchForm.tsx`, default `['linkedin']`. Passed to the cloud function call.

### 2. Categorized Results Display

**Approach A (Recommended): Tabbed Results**
- Tab bar above results: `All (47) | LinkedIn (10) | Indeed (15) | GitHub (12) | Monster (10)`
- "All" tab shows interleaved results sorted by match score
- Source-specific tabs show only that source's results
- Each result card shows a source badge (colored icon: LinkedIn blue, GitHub dark, Indeed blue, etc.)

**Approach B: Grouped Sections**
- Results displayed in sections by source with headers
- Each section independently expandable/collapsible
- Less useful for cross-source comparison

### 3. Result Card Updates

Each result card needs:
- **Source badge**: Colored chip with platform icon and name (top-right of card)
- **Profile link**: Opens the correct platform URL (not always LinkedIn)
- **Enrichment**: Only available for LinkedIn profiles (Nymeria requires LinkedIn URL). Show "Enrich" button only for LinkedIn results. For other sources, show "View Profile" link only.
- **Analyze**: AI analysis should work for all sources (uses snippet text)
- **Export**: CSV export should include a `source` column

### 4. Location Search Integration

The existing location search (`LocationModal` + `functions/location-search.js`) should work unchanged. Location is appended to the boolean query as a keyword (e.g., `"San Francisco" OR "SF Bay Area" OR remote`).

**Per-source location handling:**
- LinkedIn: Location in boolean query + metatag extraction
- Indeed: Location in boolean query; Indeed titles often include "City, State"
- GitHub: Location as keyword; less reliable (users set location optionally)
- Monster/CareerBuilder/ZipRecruiter: Location in boolean query; usually in title
- Glassdoor: Location mostly unavailable
- Stack Overflow: Location as keyword in user bio

No changes needed to `location-search.js`. The boolean query generator should include location terms for all sources the same way it does for LinkedIn today.

### 5. Search History Updates

The `search_history` Firestore collection already has a `platform` field. Update to store:
```
{
  user_id: string,
  search_query: string,
  boolean_query: string,
  platform: "multi-source",  // or comma-separated: "linkedin,indeed,github"
  sources: ["linkedin", "indeed", "github"],  // new field
  results_count: number,
  results_by_source: { linkedin: 10, indeed: 15, github: 12 },  // new field
  created_at: timestamp
}
```

---

## API Key Rotation Plan

### Current State
- The exposed key (`AIzaSyBcQJSa6zKqmpcDfRxp_6SZQxCmmOXBVHg`) has been deleted from GCP
- Available keys in GCP console:
  - "API key 3" (Jan 25 2026, restricted to 32 APIs)
  - "API key 2" (Oct 10 2025, unrestricted)
  - "firebase" (Sep 26 2025, restricted to 5 APIs)

### Rotation Steps

1. **Create a new restricted key** (preferred over using "API key 2" unrestricted):
   - Go to GCP Console > APIs & Services > Credentials
   - Create new API key named "CSE Production Key"
   - Restrict to:
     - **API restrictions**: Custom Search JSON API only
     - **Application restrictions**: None (called from Cloud Functions, IP varies)
   - Or alternatively, use "API key 2" temporarily and add restrictions later

2. **Update environment variables**:
   ```bash
   # In Firebase Functions config or .env
   GOOGLE_CSE_API_KEY=<new-key-value>
   GOOGLE_CSE_ID=<new-cse-id>  # new whole-web CSE
   ```

3. **Deploy**:
   ```bash
   cd functions
   firebase deploy --only functions:candidateSearch,functions:getGoogleCseKey
   ```

4. **Verify** the old key is fully deleted and the new key works

5. **After Phase 2**: Remove `getGoogleCseKey` function entirely (API key no longer exposed to frontend)

### Security Improvement
Moving CSE calls to the backend (Phase 2) is the primary security fix. The API key will never leave the server. This is more important than key rotation alone.

---

## Implementation Plan (Ordered)

### Step 1: API Key Rotation & New CSE Setup
- Create new API key (or use "API key 2") with CSE API restriction
- Create new "whole web" CSE in Programmable Search Engine console
- Update `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` env vars
- Verify existing LinkedIn search still works with new key/CSE

### Step 2: Backend -- `candidate-search.js` Cloud Function
- Create `functions/candidate-search.js` with `SOURCE_CONFIGS` registry
- Implement per-source query builders (site: prefixes, exclusions)
- Implement per-source result parsers
- Port Gemini boolean generation from `linkedin-search.js`
- Add `Promise.allSettled()` parallel execution across sources
- Add match scoring (port from `linkedin-search.js`)
- Add `functionBridge.candidateSearch()` method in frontend

### Step 3: Frontend -- Source Selector Component
- Create `src/components/search/SourceSelector.tsx`
- Integrate into `MinimalSearchForm.tsx` (between boolean input and search button)
- Wire `selectedSources` state to the new cloud function call

### Step 4: Frontend -- Results Display Updates
- Add source badge to result cards
- Add tabbed results view (All / per-source tabs)
- Add `source` column to CSV export
- Conditionally show Enrich button (LinkedIn only)
- Update search history writes to include `sources` and `results_by_source`

### Step 5: Deprecation & Cleanup
- Remove direct CSE `fetch()` calls from `MinimalSearchForm.tsx`
- Remove direct CSE `fetch()` calls from `searchApi.ts`
- Deprecate `functions/get-google-cse-key.js`
- Deprecate `functions/linkedin-search.js`
- Remove hardcoded CSE ID fallback (`b28705633bcb44cf0`) from `searchApi.ts`

### Step 6: Testing & Polish
- Test each source returns results for common queries
- Test pagination per source
- Test location filtering across sources
- Test export with mixed-source results
- Test error handling when individual sources fail
- Verify API key is not exposed in browser network tab

---

## Success Criteria & Verify Commands

### Functional
- [ ] Searching with LinkedIn selected returns LinkedIn profiles (same as today)
- [ ] Searching with Indeed selected returns Indeed resume results
- [ ] Searching with GitHub selected returns GitHub user profiles (not repos/orgs)
- [ ] Searching with multiple sources returns categorized results with source badges
- [ ] Pagination works independently per source
- [ ] Location search narrows results across all sources
- [ ] Export CSV includes `source` column
- [ ] AI analysis works on results from all sources
- [ ] Enrichment (Nymeria) only offered for LinkedIn results
- [ ] Failed source does not break other sources (graceful degradation)

### Security
- [ ] API key is NOT visible in browser network tab / DevTools
- [ ] Old exposed key is deleted from GCP
- [ ] New key is restricted to Custom Search JSON API

### Verify Commands
```bash
# Validate cloud functions compile
cd functions && node -e "require('./candidate-search')" && echo "OK"

# Build frontend
npm run build

# Run tests
npm test

# Check for exposed API keys in frontend bundle
grep -r "AIzaSy" dist/ && echo "EXPOSED KEY FOUND" || echo "No keys in bundle - OK"

# Deploy functions
firebase deploy --only functions:candidateSearch

# Test the function directly
firebase functions:shell
> candidateSearch({data: {keywords: "software engineer python", sources: ["linkedin", "indeed"], location: "San Francisco", page: 1}})
```

---

## Scope Boundaries

### In Scope
- Multi-source CSE search (LinkedIn, Indeed, GitHub, Glassdoor, Monster, ZipRecruiter, CareerBuilder, Stack Overflow)
- Source selector UI component
- Tabbed/categorized results display
- Backend refactor to keep API key server-side
- API key rotation
- Source-specific result parsers
- Location search working across all sources
- Export with source column
- Search history updates

### Out of Scope
- Direct API integrations with job boards (Indeed API, LinkedIn Recruiter API, etc.) -- this is CSE x-ray search only
- Scraping or crawling candidate profiles
- Chrome extension changes (extension has its own LinkedIn sourcing)
- Candidate deduplication across sources (e.g., same person on LinkedIn and GitHub)
- Paid search API tiers (staying on CSE free/standard tier)
- Nymeria enrichment for non-LinkedIn sources
- Changes to the MCP server or MCP chat
- Changes to the Clarvida auth flow
- Mobile-specific UI optimizations

---

## Risks

### 1. Google CSE Quota
- **Risk**: Each multi-source search makes N CSE API calls (one per selected source). With 8 sources selected, one user search = 8 API calls. Free tier = 100/day. Paid tier = $5 per 1,000.
- **Mitigation**: Default to LinkedIn only. Show quota impact in UI ("Searching 5 sources will use 5 API credits"). Consider caching results in Firestore for repeat queries. Limit max concurrent sources to 5.

### 2. Sparse Results on Some Platforms
- **Risk**: Glassdoor, CareerBuilder, ZipRecruiter have limited public profile indexing. Users may see 0 results and think the feature is broken.
- **Mitigation**: Show "No results found on {source}" gracefully per source. Order sources by expected result quality (LinkedIn > Indeed > GitHub > Stack Overflow > Monster > others). Add tooltips explaining each source's strengths.

### 3. Result Quality Varies by Source
- **Risk**: GitHub profiles don't have job titles. Indeed resumes may be outdated. Match scoring designed for LinkedIn may not work for other sources.
- **Mitigation**: Source-specific parsers and scoring adjustments. Don't apply LinkedIn-specific scoring to GitHub results. Weight results by source reliability.

### 4. Google CSE Rate Limiting
- **Risk**: Burst of parallel requests (8 sources x multiple users) could trigger Google's rate limiting or 429 errors.
- **Mitigation**: Use `Promise.allSettled()` with slight staggering. Implement retry with exponential backoff. Return partial results if some sources fail.

### 5. API Key Exposure During Transition
- **Risk**: During Step 1-2, the frontend still calls CSE directly with the key. If the new key is set before the backend migration (Step 2) is complete, the new key is also "exposed."
- **Mitigation**: Complete Step 2 (backend migration) immediately after Step 1. Or use a temporary/disposable key for Step 1 testing and swap to the permanent key only after Step 2 is deployed.

### 6. Boolean Query Optimization per Source
- **Risk**: The Gemini-generated boolean queries are LinkedIn-optimized. They may not perform well on Indeed or GitHub where profile content structure differs.
- **Mitigation**: Adapt the Gemini prompt per source type. For GitHub, emphasize technologies and project keywords over job titles. For Indeed, emphasize skills and certifications. This is a Phase 2 enhancement -- start with same query across all sources and iterate.
