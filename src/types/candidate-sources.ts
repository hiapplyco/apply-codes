/**
 * Multi-Source Candidate Types
 *
 * Unified schema for candidates discovered across multiple platforms.
 * Supports: LinkedIn (Google CSE), GitHub, Stack Overflow, Indeed, Google X-Ray.
 *
 * Phase 1: Types + interfaces (current)
 * Phase 2: GitHub + Stack Overflow API integrations
 * Phase 3: Google X-Ray search engine, deduplication engine
 */

// ─── Source Platform Registry ───────────────────────────────────────────────

export type CandidateSource =
  | 'linkedin'
  | 'github'
  | 'stackoverflow'
  | 'indeed'
  | 'kaggle'
  | 'wellfound'
  | 'dribbble'
  | 'behance'
  | 'xray'      // Google X-Ray search across any site
  | 'manual'
  | 'import';

export interface SourceConfig {
  id: CandidateSource;
  name: string;
  icon: string;
  enabled: boolean;
  requiresApiKey: boolean;
  rateLimit: { requests: number; windowMs: number };
  searchCapabilities: {
    booleanSearch: boolean;
    locationFilter: boolean;
    skillsFilter: boolean;
    experienceFilter: boolean;
    pagination: boolean;
    maxResults: number;
  };
}

export const SOURCE_REGISTRY: Record<CandidateSource, SourceConfig> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn (via Google CSE)',
    icon: 'linkedin',
    enabled: true,
    requiresApiKey: true,
    rateLimit: { requests: 100, windowMs: 86400000 }, // 100/day
    searchCapabilities: {
      booleanSearch: true,
      locationFilter: true,
      skillsFilter: false,
      experienceFilter: false,
      pagination: true,
      maxResults: 100,
    },
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    enabled: false, // Phase 2
    requiresApiKey: true,
    rateLimit: { requests: 30, windowMs: 60000 }, // 30/min
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: true,
      skillsFilter: true,
      experienceFilter: false,
      pagination: true,
      maxResults: 1000,
    },
  },
  stackoverflow: {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    icon: 'layers',
    enabled: false, // Phase 2
    requiresApiKey: false,
    rateLimit: { requests: 300, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: true,
      skillsFilter: true,
      experienceFilter: false,
      pagination: true,
      maxResults: 500,
    },
  },
  indeed: {
    id: 'indeed',
    name: 'Indeed',
    icon: 'briefcase',
    enabled: false, // Phase 2
    requiresApiKey: true,
    rateLimit: { requests: 50, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: true,
      locationFilter: true,
      skillsFilter: false,
      experienceFilter: true,
      pagination: true,
      maxResults: 200,
    },
  },
  kaggle: {
    id: 'kaggle',
    name: 'Kaggle',
    icon: 'bar-chart',
    enabled: false, // Phase 3
    requiresApiKey: false,
    rateLimit: { requests: 100, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: false,
      skillsFilter: true,
      experienceFilter: false,
      pagination: true,
      maxResults: 100,
    },
  },
  wellfound: {
    id: 'wellfound',
    name: 'Wellfound (AngelList)',
    icon: 'rocket',
    enabled: false, // Phase 3
    requiresApiKey: true,
    rateLimit: { requests: 50, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: true,
      skillsFilter: true,
      experienceFilter: true,
      pagination: true,
      maxResults: 100,
    },
  },
  dribbble: {
    id: 'dribbble',
    name: 'Dribbble',
    icon: 'palette',
    enabled: false, // Phase 3
    requiresApiKey: true,
    rateLimit: { requests: 60, windowMs: 60000 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: true,
      skillsFilter: true,
      experienceFilter: false,
      pagination: true,
      maxResults: 100,
    },
  },
  behance: {
    id: 'behance',
    name: 'Behance',
    icon: 'pen-tool',
    enabled: false, // Phase 3
    requiresApiKey: true,
    rateLimit: { requests: 100, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: false,
      skillsFilter: true,
      experienceFilter: false,
      pagination: true,
      maxResults: 100,
    },
  },
  xray: {
    id: 'xray',
    name: 'Google X-Ray',
    icon: 'search',
    enabled: false, // Phase 2
    requiresApiKey: true,
    rateLimit: { requests: 100, windowMs: 86400000 },
    searchCapabilities: {
      booleanSearch: true,
      locationFilter: true,
      skillsFilter: false,
      experienceFilter: false,
      pagination: true,
      maxResults: 100,
    },
  },
  manual: {
    id: 'manual',
    name: 'Manual Entry',
    icon: 'edit',
    enabled: true,
    requiresApiKey: false,
    rateLimit: { requests: Infinity, windowMs: 0 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: false,
      skillsFilter: false,
      experienceFilter: false,
      pagination: false,
      maxResults: Infinity,
    },
  },
  import: {
    id: 'import',
    name: 'CSV/File Import',
    icon: 'upload',
    enabled: true,
    requiresApiKey: false,
    rateLimit: { requests: Infinity, windowMs: 0 },
    searchCapabilities: {
      booleanSearch: false,
      locationFilter: false,
      skillsFilter: false,
      experienceFilter: false,
      pagination: false,
      maxResults: Infinity,
    },
  },
};

// ─── Unified Candidate Profile ──────────────────────────────────────────────

export interface UnifiedCandidateProfile {
  // Identity
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;

  // Professional
  currentTitle?: string;
  currentCompany?: string;
  headline?: string;
  summary?: string;

  // Location
  location?: {
    city?: string;
    state?: string;
    country?: string;
    raw?: string; // Original unprocessed location string
  };

  // Skills & experience
  skills: string[];
  experienceYears?: number;
  education?: string;

  // Contact (from enrichment)
  contact?: {
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    personalWebsite?: string;
  };

  // Source tracking
  sources: CandidateSourceEntry[];
  primarySource: CandidateSource;
  discoveredAt: string;
  lastUpdatedAt: string;

  // Scoring
  relevanceScore?: number;
  matchScore?: number;

  // Raw data from each source
  sourceProfiles: Partial<Record<CandidateSource, SourceProfileData>>;

  // Status
  status: 'discovered' | 'enriched' | 'contacted' | 'responded' | 'interviewing' | 'archived';
  tags: string[];
  notes?: string;
}

export interface CandidateSourceEntry {
  source: CandidateSource;
  profileUrl: string;
  discoveredAt: string;
  snippet?: string;
  searchRank?: number;
}

export interface SourceProfileData {
  raw: Record<string, unknown>;
  fetchedAt: string;
  profileUrl: string;
}

// ─── Deduplication ──────────────────────────────────────────────────────────

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number; // 0-1
  matchedCandidateId?: string;
  matchMethod: 'email' | 'phone' | 'name_company' | 'profile_url' | 'fuzzy';
}

// ─── Search Request / Response ──────────────────────────────────────────────

export interface MultiSourceSearchRequest {
  query: string;
  sources: CandidateSource[];
  filters?: {
    location?: string;
    skills?: string[];
    experienceMin?: number;
    experienceMax?: number;
  };
  maxResultsPerSource?: number;
  page?: number;
}

export interface MultiSourceSearchResponse {
  candidates: UnifiedCandidateProfile[];
  metadata: {
    totalResults: number;
    resultsBySource: Partial<Record<CandidateSource, number>>;
    searchDurationMs: number;
    query: string;
    deduplicatedCount: number;
  };
}

// ─── Source Service Interface ────────────────────────────────────────────────

export interface CandidateSourceService {
  source: CandidateSource;
  isConfigured(): boolean;
  search(query: string, options?: {
    location?: string;
    skills?: string[];
    maxResults?: number;
    page?: number;
  }): Promise<UnifiedCandidateProfile[]>;
  getProfile?(profileUrl: string): Promise<UnifiedCandidateProfile | null>;
}
