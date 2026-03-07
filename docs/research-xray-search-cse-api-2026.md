# X-Ray Search & Google CSE API Research for Recruitment SaaS

**Date:** March 6, 2026
**Purpose:** Actionable research for building multi-source candidate search into a recruitment SaaS platform.

---

## CRITICAL FINDING: Google Custom Search JSON API Is Sunsetting

**The Google Custom Search JSON API is closed to new customers.** Existing customers have until **January 1, 2027** to transition. This fundamentally changes the build-vs-buy decision for any new recruitment SaaS.

- **Vertex AI Search** is Google's recommended replacement (supports up to 50 domains)
- Vertex AI Search has a free trial (10,000 queries/account/month), then metered per-query pricing
- For full web search (not just site-restricted), Google says to "contact them" -- no self-serve option

**Recommendation:** Do NOT build on Google CSE API for a new product. Use a third-party SERP API instead (see Section 3).

---

## 1. X-Ray Search by Platform: What Works Today

### LinkedIn (`site:linkedin.com/in/`)

**STATUS: SEVERELY DEGRADED since December 2023**

LinkedIn systematically stripped key profile data from public search engine indexing. As of early 2024 and continuing into 2026:

**No longer indexed by Google:**
- Headline
- About section
- Work experience details
- Education background
- Skills

**What still works:**
- Name (often first name + last initial only on public view)
- URL slug (often contains full name: `linkedin.com/in/john-doe-123abc`)
- Basic profile existence detection
- Query pattern: `site:linkedin.com/in/ "software engineer" "San Francisco"` -- but matching is now primarily against name/URL, NOT profile content

**Why LinkedIn did this:** Push recruiters toward LinkedIn Recruiter ($$$) and LinkedIn Sales Navigator. Expect further restrictions, not relaxation.

**Practical impact for a SaaS product:** LinkedIn x-ray search is no longer a reliable primary sourcing channel. It can find profiles but cannot effectively filter by skills, experience, or current role via Google indexing alone. You would need to:
1. Use LinkedIn x-ray to discover profile URLs
2. Then scrape or use LinkedIn's API to get actual profile data (compliance risk)
3. OR integrate with LinkedIn Recruiter/Talent Hub API (expensive, gated)

### Indeed (`site:indeed.com/r/`)

**STATUS: STILL FUNCTIONAL but diminishing**

- The `/r/` path structure for public resumes is still live and indexed
- Query pattern: `site:indeed.com/r/ "software engineer" "Python" "New York"`
- Indeed does NOT structure profiles with categories like LinkedIn -- everything is keyword-based
- Indeed is pushing recruiters toward **Indeed Smart Sourcing** (their paid tool) and may restrict public indexing further
- Indeed resumes are opt-in public, so the pool is smaller than LinkedIn

**Recommendation:** Include Indeed x-ray as a source but plan for it to degrade. Build abstraction layers so you can swap sources.

### GitHub (`site:github.com`)

**STATUS: WORKS WELL for developer sourcing**

GitHub profiles remain well-indexed. Key patterns:

```
# Find developer profiles (not repos)
site:github.com "React" "San Francisco" (resume OR portfolio OR "about me")

# Target user pages specifically
site:github.com/users "python" "machine learning"

# GitHub Pages personal sites
site:github.io "software engineer" "resume"
```

**What you can extract from indexed profiles:**
- Username, display name, bio
- Location (if set by user)
- Organization memberships
- Pinned repo descriptions
- Contribution activity indicators (follower count patterns)

**Limitation:** Many developers don't fill out their profile bio/location. GitHub search is best for finding active open-source contributors, not passive candidates.

### Stack Overflow (`site:stackoverflow.com/users`)

**STATUS: WORKS for niche developer sourcing**

```
# Find user profiles with specific skills and location
site:stackoverflow.com/users "java" "location * california"

# High-reputation users (proxy for expertise)
site:stackoverflow.com/users "python" "1000.. reputation"
```

**What's indexed:** Username, location, tags/skills, reputation score, bio text.

**Limitation:** Stack Overflow user base is shrinking as developers shift to AI assistants. The most active users tend to be senior, so it skews toward experienced developers. Good for niche/specialized roles, not volume sourcing.

### Monster & CareerBuilder

**STATUS: EFFECTIVELY DEAD**

Monster and CareerBuilder filed Chapter 11 bankruptcy in June 2025. Assets were sold:
- Job board operations to JobGet Inc.
- Media properties to Valnet Inc.

Public profile indexing from these platforms is unreliable and likely to disappear entirely. **Remove from any sourcing strategy.**

### ZipRecruiter

**STATUS: LIMITED**

ZipRecruiter has never had strong public profile indexing. Their model is job-posting-centric, not resume-database-centric. Not a viable x-ray target.

---

## 2. Google CSE API Technical Details (For Existing Customers Only)

### Pricing
| Tier | Queries | Cost |
|------|---------|------|
| Free | 100/day | $0 |
| Paid | Up to 10,000/day | $5 per 1,000 queries |

### `siteSearch` Parameter vs `site:` in Query

- **`siteSearch` parameter:** Restricts to ONE domain. Cannot do multiple sites in a single request.
- **`site:` in query string:** Can combine: `site:linkedin.com OR site:github.com` -- but this uses up query terms and may reduce result quality.
- **For multi-site search:** You must either use `site:` OR operators in the query, or make separate API calls per site. Separate calls give cleaner results.

### Multi-Site in One Request
Technically possible via `site:X OR site:Y` in the `q` parameter, but:
- Reduces available query length for actual search terms
- Results are mixed/interleaved (harder to parse)
- Quality degrades with more sites

**Recommendation:** Separate requests per site, parallelized.

### Vertex AI Search (Replacement)
- Free trial: 10,000 queries/account/month
- Supports up to 50 domains in a single search app
- Metered per-query billing after free tier
- More complex setup than CSE (requires GCP project, data stores)
- Better for site search use cases than web-wide x-ray search

---

## 3. Alternative Search APIs: The Practical Options

### Recommended: Serper.dev

| Metric | Details |
|--------|---------|
| Free tier | 2,500 queries (no CC required) |
| Pricing | $50/50K queries ($1.00/1K) scaling to $0.30/1K at volume |
| Speed | ~1.8 seconds average |
| Rate limit | Up to 300 queries/second |
| Model | Pay-as-you-go, credits last 6 months |
| Google operators | Supports `site:`, boolean, all standard operators |
| Geo/location | Supports `gl` (country) and `location` parameters |

**Why Serper for recruitment SaaS:**
- Cheapest at scale for Google results
- Supports all x-ray search operators natively
- No monthly subscription (good for variable usage)
- Fast enough for real-time search UX
- Returns structured JSON including snippets, links, position

### Alternative: SerpAPI

| Metric | Details |
|--------|---------|
| Free tier | 100 queries |
| Pricing | $0.015/query scaling to $0.0075 at volume |
| Speed | ~5.5 seconds average |
| Engines | Google, Bing, Yahoo, Yandex, Baidu + many more |
| Unique feature | Parses ALL Google SERP features (knowledge panels, etc.) |

**When to use:** If you need multi-engine search (Bing indexes LinkedIn data differently than Google) or need richer SERP parsing. More expensive at scale.

### Alternative: SearchAPI / ScrapingDog

Cheaper alternatives at very high volume (1M+ queries/month). Less mature ecosystems.

### NOT Recommended: Direct Google Search API

Google does not offer a general-purpose web search API anymore (CSE is closing). There is no legitimate way to query Google search results at scale except through SERP API providers.

---

## 4. Location-Based Search: What Actually Works

### Keyword-Based Location Filtering (Current Approach)

Adding location terms to x-ray queries (e.g., `"San Francisco"`) works by matching text on the profile page. Accuracy depends entirely on:
- Whether the platform indexes location data (LinkedIn: no longer for most fields)
- Whether users entered location consistently
- Ambiguity: "Springfield" exists in 30+ US states

**Accuracy estimate:** 60-70% for LinkedIn (degraded), 70-80% for GitHub/Stack Overflow (if user set location), ~50% for Indeed (free text).

### Google CSE/Serper Geo Parameters

- `gl` parameter: Sets the country for Google's geolocation context (affects ranking, not filtering)
- `location` parameter (Serper): Simulates search from a specific location
- These affect **result ranking** but do NOT filter results to a geography

### Better Approaches for Geo-Targeting

1. **Post-search filtering:** Fetch results, then extract and normalize location from profile data. More accurate than query-time filtering.
2. **LinkedIn API** (if you have access): Provides structured location fields.
3. **GitHub API:** User profiles have a `location` field you can query directly via `https://api.github.com/search/users?q=location:san+francisco+language:python`.
4. **IP-based geolocation of profile URLs:** Not useful (profiles are on CDNs).
5. **Combine x-ray with geocoding APIs:** Extract location mentions from snippets, geocode them, filter by radius.

**Recommendation:** Treat location as a post-search enrichment/filter step, not a query-time constraint. X-ray search is too imprecise for geo-filtering alone.

---

## 5. How Modern Sourcing Tools Do It

### HireEZ Architecture
- Aggregates from **40+ platforms** (LinkedIn, GitHub, job boards, patents, publications)
- Maintains its own **enriched profile database** -- does NOT rely on real-time x-ray search
- NLP engine maps skills/roles semantically (e.g., "DevOps" matches "SRE")
- Dynamic knowledge graph of technical skills and role relationships
- Contact info enrichment layer (email/phone discovery)

### SeekOut Architecture
- **800M+ professional profiles** in their talent graph
- Aggregates from LinkedIn, GitHub, patents, research papers, ATS/CRM data
- Semantic/LLM-powered search (not just keyword matching)
- Deep technical search (can find developers by actual code contributions)

### Key Insight for Your SaaS

The serious sourcing tools do NOT rely on real-time x-ray search. They:
1. **Crawl and index** profile data into their own database (legal gray area)
2. **Enrich** profiles with data from multiple sources
3. **Provide semantic search** over their own index
4. Use x-ray search as ONE input into a broader data pipeline, not as the primary search mechanism

---

## 6. Recommended Architecture for a Recruitment SaaS

### Search Layer
```
User Query
    |
    v
Query Parser (extract: skills, location, experience, platform preferences)
    |
    v
Parallel SERP API Calls (Serper.dev)
    |-- site:linkedin.com/in/ + skills + location
    |-- site:github.com + skills + location
    |-- site:stackoverflow.com/users + skills
    |-- site:indeed.com/r/ + skills + location
    |
    v
Result Aggregator & Deduplication
    |
    v
Profile Enrichment (extract structured data from snippets/URLs)
    |
    v
Location Normalization & Geo-filtering
    |
    v
Ranked Results to User
```

### Cost Estimate (Serper.dev)
- 4 parallel searches per user query = 4 credits
- At $1.00/1K queries: $0.004 per user search
- 10,000 user searches/month = $40/month in API costs
- At scale ($0.30/1K): $0.0012 per user search = $12/month for 10K searches

### Key Technical Decisions

1. **Use Serper.dev** (not Google CSE) -- CSE is sunsetting and more expensive
2. **Separate API calls per site** -- cleaner results, easier parsing, parallel execution
3. **Cache aggressively** -- profile URLs don't change often; cache results for 24-72 hours
4. **Build your own profile index** over time -- store enriched profiles from search results
5. **LinkedIn is supplementary**, not primary -- its x-ray value has cratered
6. **GitHub + Stack Overflow** are your best bets for tech roles
7. **Post-process for location** -- don't rely on query-time geo-filtering

### Compliance Considerations

- X-ray search accesses publicly available information (generally legal)
- Scraping profile pages after finding URLs via x-ray may violate platform ToS
- LinkedIn specifically prohibits scraping (hiQ v. LinkedIn case is nuanced)
- GDPR/CCPA apply to storing candidate data regardless of source
- Build opt-out mechanisms from day one

---

## Sources

- [LinkedIn X-Ray Search 2026 Guide - SalesBread](https://salesbread.com/linkedin-x-ray-search/)
- [LinkedIn X-Ray Search Operators 2025 - Linked Helper](https://www.linkedhelper.com/blog/linkedin-xray-search/)
- [The Death of X-Ray Search For Recruiters - PCRecruiter](https://www.pcrecruiter.net/site/2024/04/09/death-of-x-ray-search-for-recruiters/)
- [X-Ray Search Guide 2026 - Juicebox AI](https://juicebox.ai/blog/xray-search)
- [Google Custom Search JSON API Overview](https://developers.google.com/custom-search/v1/overview)
- [Custom Search Site Restricted API Migration](https://developers.google.com/custom-search/v1/site_restricted_api)
- [SerpAPI vs Serper vs Alternatives 2026](https://serpapi.com/blog/compare-serpapi-with-the-alternatives-serper-and-searchapi/)
- [Best SERP APIs 2026 - RapidSeedbox](https://www.rapidseedbox.com/blog/best-serp-apis)
- [Serper.dev](https://serper.dev/)
- [hireEZ vs SeekOut vs Findem Comparison](https://www.findem.ai/knowledge-center/hireez-vs-seekout-vs-findem)
- [2026 Guide to Top Candidate Sourcing Tools - Juicebox](https://juicebox.ai/blog/2026-guide-to-the-top-candidate-sourcing-tools-for-recruiters)
- [GitHub X-Ray Search for Developers - Fluar](https://fluar.com/tools/google-x-ray-search/github)
- [Stack Overflow X-Ray Search - Reczee](https://www.reczee.com/blog/sourcing-on-stack-overflow-a-recruiters-guide)
- [Indeed Smart Sourcing](https://www.indeed.com/employers/smart-sourcing)
- [Google CSE API Reference](https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list)
- [Vertex AI Search Pricing](https://cloud.google.com/generative-ai-app-builder/pricing)
- [Migrate from CSE to Vertex AI Search](https://docs.google.com/generative-ai-app-builder/docs/migrate-from-cse)
- [Bye Bye LinkedIn X-Ray - Jobin.cloud](https://www.jobin.cloud/blog/bye-bye-LinkedIn-X-Ray)
- [LinkedIn X-Ray No Longer Working? - Full Stack Recruiter](https://newsletter.fullstackrecruiter.net/p/linkedin-x-ray-search)
- [X-Ray Search Using Google - AmazingHiring](https://amazinghiring.com/blog/x-ray-search-how-to-source-using-google-and-other-platforms)
