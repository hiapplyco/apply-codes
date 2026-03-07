/**
 * Multi-source candidate search types.
 * Shared between frontend components and cloud function responses.
 */

export type CandidateSource =
  | 'linkedin'
  | 'indeed'
  | 'github'
  | 'stackoverflow'
  | 'glassdoor'
  | 'behance'
  | 'dribbble';

export interface SourceConfig {
  id: CandidateSource;
  label: string;
  siteRestriction: string;
  excludeTerms?: string[];
  isPortfolio: boolean;
  enrichmentSupported: boolean;
  icon: string;
  color: string;
}

export interface CandidateSearchRequest {
  keywords: string;
  sources: CandidateSource[];
  location?: string;
  experienceLevel?: string;
  page?: number;
  resultsPerSource?: number;
  useAIGeneration?: boolean;
}

export interface CandidateResult {
  id: string;
  source: CandidateSource;
  name: string;
  title: string;
  company: string;
  location: string;
  profileUrl: string;
  snippet: string;
  skills: string[];
  matchScore: number;
  searchRank: number;
  serperPosition: number;
  meta: Record<string, any>;
}

export interface SourceSearchResult {
  source: CandidateSource;
  results: CandidateResult[];
  totalEstimated: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
  latencyMs: number;
}

export interface CandidateSearchResponse {
  success: boolean;
  data: {
    sources: SourceSearchResult[];
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
      cacheKey?: string;
      cached: boolean;
    };
  };
  error?: string;
}

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
    excludeTerms: ['-site:github.com/orgs', '-site:github.com/topics', '-site:github.com/marketplace', '-site:github.com/trending'],
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

export const ALL_SOURCES: CandidateSource[] = [
  'linkedin', 'indeed', 'github', 'stackoverflow', 'glassdoor', 'behance', 'dribbble',
];
