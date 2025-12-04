/**
 * Types for the Profile Enrichment feature
 */

// Re-export from main types
export type { EnrichedProfileData, Education, Experience, Language, SocialProfile } from '@/types';

/**
 * Input type for enrichment - determines which API method to use
 */
export type EnrichmentInputType = 'linkedin' | 'email' | 'name';

/**
 * Parameters for name-based person search
 */
export interface NameSearchParams {
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  location?: string;
  industry?: string;
}

/**
 * A single search result from name search (before full enrichment)
 */
export interface SearchResult {
  uuid?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  location?: string;
  country?: string;
  job_title?: string;
  job_company_name?: string;
  industry?: string;
  linkedin_username?: string;
  linkedin_url?: string;
  work_email?: string;
  personal_emails?: string[];
  mobile_phone?: string;
}

/**
 * History item for tracking recent enrichments
 */
export interface EnrichmentHistoryItem {
  id: string;
  inputType: EnrichmentInputType;
  inputValue: string;
  displayName: string;
  result: EnrichedProfileData | null;
  timestamp: string;
  success: boolean;
}

/**
 * Result wrapper for enrichment operations
 */
export interface EnrichmentResult {
  success: boolean;
  data: EnrichedProfileData | null;
  error?: string;
  creditsUsed?: number;
}

/**
 * Props for the enrichment result card
 */
export interface EnrichmentResultCardProps {
  data: EnrichedProfileData;
  onSaveToProject?: (projectId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Form submission handlers
 */
export interface LinkedInFormProps {
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
}

export interface EmailFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

export interface NameSearchFormProps {
  onSubmit: (params: NameSearchParams) => Promise<void>;
  isLoading: boolean;
}
