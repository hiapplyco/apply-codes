export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  name: string;
  location: string;
  [key: string]: any;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
  work_email?: string;
  personal_emails?: string[];
  phone_numbers?: string[];
  twitter_url?: string;
  github_url?: string;
}

export interface ContextItem {
  id: string;
  type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'perplexity' | 'manual_input' | 'location_input';
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  file_name?: string;
  file_type?: string;
  created_at?: string | Date | { toDate?: () => Date; seconds?: number; nanoseconds?: number };
  project_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, any>;
  isExpanded?: boolean;
  [key: string]: any;
}

export interface MinimalSearchFormProps {
  userId: string | null;
  selectedProjectId?: string | null;
  isClarvidaMode?: boolean;
  initialBooleanString?: string;
  initialJobTitle?: string;
}

/**
 * Extract a location string from a LinkedIn profile snippet.
 * Tries several regex patterns in order of specificity and filters out
 * strings that look like job-title / skill keywords rather than places.
 */
export const extractLocationFromSnippet = (snippet: string): string | undefined => {
  // Common location patterns in LinkedIn snippets
  const locationPatterns = [
    // "at Company in Location" or "at Company, Location"
    /at\s+[^,]+(?:,\s*|\s+in\s+)([^•·|]+?)(?:\s*[•·|]|$)/i,
    // "Location Area" or "Location Metropolitan Area"
    /([^•·|]+?)\s*(?:Area|Metropolitan Area|Metro)(?:\s*[•·|]|$)/i,
    // "City, State" or "City, Country"
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)(?:\s*[•·|]|$)/,
    // "Location" followed by separator
    /([^•·|]+?)(?:\s*[•·|]|$)/
  ];

  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common non-location phrases
      const excludePatterns = [
        /\b(experience|years|developer|engineer|manager|director|senior|junior|lead|head|chief|president|ceo|cto|cfo|vp|vice|consulting|solutions|services|technologies|technology|systems|software|data|analytics|marketing|sales|operations|product|design|strategy|business|corporate|global|international|remote|freelance|consultant|contractor|full.time|part.time|seeking|looking|available|linkedin|member|profile|summary|about|skills|education|university|college|degree|bachelor|master|phd|doctorate|certified|certification)\b/i
      ];

      if (excludePatterns.some(pattern => pattern.test(location))) {
        continue;
      }

      // Clean up the location string
      return location
        .replace(/\s+/g, ' ')
        .replace(/[•·|]/g, '')
        .trim();
    }
  }

  return undefined;
};
