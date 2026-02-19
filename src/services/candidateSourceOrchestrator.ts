/**
 * Candidate Source Orchestrator
 *
 * Coordinates searches across multiple candidate sources and deduplicates results.
 * Currently wraps existing LinkedIn/Google CSE search with a unified interface.
 *
 * Phase 1 (current): LinkedIn via Google CSE + orchestrator scaffolding
 * Phase 2: Add GitHub API, Stack Overflow, Google X-Ray
 * Phase 3: Add Indeed Partner, Kaggle, Wellfound, deduplication engine
 */

import {
  CandidateSource,
  CandidateSourceService,
  MultiSourceSearchRequest,
  MultiSourceSearchResponse,
  UnifiedCandidateProfile,
  DeduplicationResult,
  SOURCE_REGISTRY,
} from '@/types/candidate-sources';

// ─── Deduplication Utilities ────────────────────────────────────────────────

function normalizeForComparison(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function checkDuplicate(
  candidate: UnifiedCandidateProfile,
  existing: UnifiedCandidateProfile[]
): DeduplicationResult {
  // Tier 1: Exact email match (highest confidence)
  if (candidate.contact?.email) {
    const match = existing.find(
      e => e.contact?.email && normalizeForComparison(e.contact.email) === normalizeForComparison(candidate.contact!.email!)
    );
    if (match) {
      return { isDuplicate: true, confidence: 1.0, matchedCandidateId: match.id, matchMethod: 'email' };
    }
  }

  // Tier 2: Profile URL match
  for (const source of candidate.sources) {
    const match = existing.find(
      e => e.sources.some(s => normalizeForComparison(s.profileUrl) === normalizeForComparison(source.profileUrl))
    );
    if (match) {
      return { isDuplicate: true, confidence: 0.95, matchedCandidateId: match.id, matchMethod: 'profile_url' };
    }
  }

  // Tier 3: Name + Company match (moderate confidence)
  if (candidate.name && candidate.currentCompany) {
    const match = existing.find(
      e => e.name && e.currentCompany &&
        normalizeForComparison(e.name) === normalizeForComparison(candidate.name) &&
        normalizeForComparison(e.currentCompany!) === normalizeForComparison(candidate.currentCompany!)
    );
    if (match) {
      return { isDuplicate: true, confidence: 0.8, matchedCandidateId: match.id, matchMethod: 'name_company' };
    }
  }

  return { isDuplicate: false, confidence: 0, matchMethod: 'fuzzy' };
}

function mergeCandidateProfiles(
  existing: UnifiedCandidateProfile,
  incoming: UnifiedCandidateProfile
): UnifiedCandidateProfile {
  return {
    ...existing,
    // Merge skills (union)
    skills: [...new Set([...existing.skills, ...incoming.skills])],
    // Prefer richer data
    currentTitle: existing.currentTitle || incoming.currentTitle,
    currentCompany: existing.currentCompany || incoming.currentCompany,
    location: existing.location?.city ? existing.location : incoming.location,
    headline: existing.headline || incoming.headline,
    summary: existing.summary || incoming.summary,
    experienceYears: existing.experienceYears ?? incoming.experienceYears,
    // Merge sources
    sources: [...existing.sources, ...incoming.sources],
    sourceProfiles: { ...existing.sourceProfiles, ...incoming.sourceProfiles },
    // Keep best scores
    relevanceScore: Math.max(existing.relevanceScore ?? 0, incoming.relevanceScore ?? 0),
    lastUpdatedAt: new Date().toISOString(),
  };
}

// ─── Source Service Registry ────────────────────────────────────────────────

const sourceServices = new Map<CandidateSource, CandidateSourceService>();

export function registerSourceService(service: CandidateSourceService): void {
  sourceServices.set(service.source, service);
}

export function getEnabledSources(): CandidateSource[] {
  return Object.entries(SOURCE_REGISTRY)
    .filter(([, config]) => config.enabled)
    .map(([id]) => id as CandidateSource);
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

export async function searchCandidates(
  request: MultiSourceSearchRequest
): Promise<MultiSourceSearchResponse> {
  const startTime = Date.now();
  const allCandidates: UnifiedCandidateProfile[] = [];
  const resultsBySource: Partial<Record<CandidateSource, number>> = {};
  let deduplicatedCount = 0;

  // Search each requested source in parallel
  const searchPromises = request.sources
    .filter(source => SOURCE_REGISTRY[source]?.enabled)
    .map(async (source) => {
      const service = sourceServices.get(source);
      if (!service || !service.isConfigured()) {
        return { source, results: [] as UnifiedCandidateProfile[] };
      }

      try {
        const results = await service.search(request.query, {
          location: request.filters?.location,
          skills: request.filters?.skills,
          maxResults: request.maxResultsPerSource ?? 20,
          page: request.page ?? 1,
        });
        return { source, results };
      } catch (error) {
        console.error(`[CandidateOrchestrator] ${source} search failed:`, error);
        return { source, results: [] as UnifiedCandidateProfile[] };
      }
    });

  const sourceResults = await Promise.all(searchPromises);

  // Merge and deduplicate results
  for (const { source, results } of sourceResults) {
    resultsBySource[source] = results.length;

    for (const candidate of results) {
      const dedup = checkDuplicate(candidate, allCandidates);

      if (dedup.isDuplicate && dedup.matchedCandidateId) {
        // Merge into existing profile
        const existingIdx = allCandidates.findIndex(c => c.id === dedup.matchedCandidateId);
        if (existingIdx >= 0) {
          allCandidates[existingIdx] = mergeCandidateProfiles(allCandidates[existingIdx], candidate);
          deduplicatedCount++;
        }
      } else {
        allCandidates.push(candidate);
      }
    }
  }

  // Sort by relevance score descending
  allCandidates.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return {
    candidates: allCandidates,
    metadata: {
      totalResults: allCandidates.length,
      resultsBySource,
      searchDurationMs: Date.now() - startTime,
      query: request.query,
      deduplicatedCount,
    },
  };
}
