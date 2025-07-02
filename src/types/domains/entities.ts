// Domain types for normalized entities (Phase 2.1)
// Supports canonical company and location management

export interface CompanyEntity {
  id: string;
  canonical_name: string;
  aliases: string[];
  domain?: string;
  industry?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationEntity {
  id: string;
  canonical_name: string;
  city: string;
  state?: string;
  country: string;
  aliases: string[];
  coordinates?: [number, number]; // [longitude, latitude]
  created_at: string;
  updated_at: string;
}

export interface EnhancedCandidate {
  id: string;
  name: string;
  linkedin_url: string;
  job_title?: string;
  company?: string;
  location?: string;
  
  // Normalized entity references
  company_id?: string;
  location_id?: string;
  
  // Enhanced data fields
  experience_years?: number;
  seniority_level?: SeniorityLevel;
  enrichment_status: EnrichmentStatus;
  canonical_linkedin_url?: string;
  last_enrichment?: string;
  
  // Contact information
  work_email?: string;
  personal_emails?: string[];
  mobile_phone?: string;
  
  // Profile data
  profile_summary?: string;
  skills?: string[];
  profile_completeness?: number;
  
  // Metadata
  search_string?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  job_id?: number;
}

export type SeniorityLevel = 
  | 'Intern'
  | 'Entry'
  | 'Junior'
  | 'Mid'
  | 'Senior'
  | 'Lead'
  | 'Management'
  | 'Executive';

export type EnrichmentStatus = 
  | 'pending'
  | 'enriched'
  | 'failed'
  | 'partial';

export type ExperienceLevel = SeniorityLevel;

// Utility types for data normalization
export interface CompanyNormalizationResult {
  company_id: string;
  canonical_name: string;
  was_created: boolean;
}

export interface LocationNormalizationResult {
  location_id: string;
  canonical_name: string;
  parsed_city: string;
  parsed_state?: string;
  parsed_country: string;
  was_created: boolean;
}

// Data migration types
export interface DataMigrationStats {
  total_candidates: number;
  processed_candidates: number;
  companies_created: number;
  locations_created: number;
  candidates_enhanced: number;
  errors: number;
}

// Search and filtering types with normalized data
export interface SearchFilters {
  location_ids?: string[];
  company_ids?: string[];
  experience_range?: [number, number];
  seniority_levels?: SeniorityLevel[];
  enrichment_status?: EnrichmentStatus[];
  skills?: string[];
  industries?: string[];
}

export interface SearchPagination {
  page: number;
  limit: number;
  hasMore: boolean;
  totalEstimate: number;
}

export interface BackgroundSearchJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results_processed: number;
  total_results: number;
  search_string: string;
  filters: SearchFilters;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

// Analytics types for improved tracking
export interface EntityUsageStats {
  company_stats: Array<{
    company_id: string;
    canonical_name: string;
    candidate_count: number;
    search_count: number;
  }>;
  location_stats: Array<{
    location_id: string;
    canonical_name: string;
    candidate_count: number;
    search_count: number;
  }>;
  seniority_distribution: Record<SeniorityLevel, number>;
  experience_distribution: Record<string, number>;
}

// Enrichment types
export interface EnrichmentRequest {
  candidate_id: string;
  linkedin_url: string;
  force_refresh?: boolean;
}

export interface EnrichmentResult {
  candidate_id: string;
  status: EnrichmentStatus;
  enriched_data?: {
    work_email?: string;
    personal_emails?: string[];
    mobile_phone?: string;
    company_domain?: string;
    updated_job_title?: string;
    updated_company?: string;
    updated_location?: string;
    skills?: string[];
    experience_years?: number;
  };
  error_message?: string;
  enriched_at: string;
}