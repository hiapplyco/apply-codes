
import { useState } from 'react';
import { toast } from "sonner";
import { functionBridge } from "@/lib/function-bridge";
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { EnrichedProfileData } from "../types";

// Types for search parameters
export interface PersonSearchParams {
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  country?: string;
  filter?: string;
  require?: string;
  limit?: number;
  offset?: number;
}

// Types for API responses
interface SearchResult {
  data: EnrichedProfileData;
  metadata?: any;
  status: number;
}

interface SearchResponse {
  data: SearchResult[];
  status: number;
  total: number;
}

// Updated response type from edge function
interface EnrichmentResponse {
  success: boolean;
  data: any;
  message: string;
  profileUrl?: string;
}

export const useProfileEnrichment = () => {
  // Usage limit gating
  const { checkAndExecute, UsageLimitModalComponent, isLimitReached } = useUsageLimit();

  // State management
  const [enrichedData, setEnrichedData] = useState<EnrichedProfileData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  /**
   * Enriches a single LinkedIn profile using the profile URL
   * Gated by usage limits — each successful enrichment consumes 1 credit
   */
  const enrichProfile = async (profileUrl: string): Promise<EnrichedProfileData | null> => {
    const result = await checkAndExecute('candidates_enriched', async () => {
      try {
        setIsLoading(true);
        setError(null);

        const toastId = toast.loading("Fetching contact information...");
        const data = await functionBridge.getContactInfo({ profileUrl });
        toast.dismiss(toastId);

        if (data?.error && !data?.success) {
          const errorMsg = data.suggestion
            ? `${data.error}. ${data.suggestion}`
            : data.error;
          throw new Error(errorMsg);
        }

        if ((data as EnrichmentResponse)?.success !== undefined) {
          const enrichmentResponse = data as EnrichmentResponse;

          if (enrichmentResponse.success && enrichmentResponse.data) {
            const profileData = enrichmentResponse.data.data || enrichmentResponse.data;
            setEnrichedData(profileData);
            toast.success('Contact information retrieved');
            return profileData;
          } else if (enrichmentResponse.success && !enrichmentResponse.data) {
            toast.info("No contact information available for this profile");
            setEnrichedData(null);
            return null;
          }
        }

        if (data) {
          const profileData = (data as any).data || data;
          setEnrichedData(profileData);
          toast.success('Contact information retrieved');
          return profileData;
        } else {
          toast.info("No contact information available for this profile");
          return null;
        }
      } catch (err) {
        console.error('Error enriching profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Could not retrieve contact information';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    });
    return result;
  };

  /**
   * Searches for persons matching the provided search parameters
   * Gated by usage limits — each successful search consumes 1 credit
   */
  const searchPerson = async (params: PersonSearchParams): Promise<SearchResult[]> => {
    const result = await checkAndExecute('candidates_enriched', async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSearchResults([]);

        toast.loading("Searching for contact information...");
        const response = await functionBridge.enrichProfile({ searchParams: params });
        toast.dismiss();

        if (response?.data && response.data.length > 0) {
          setSearchResults(response.data);
          setTotalResults(response.total || response.data.length);
          return response.data;
        } else {
          toast.error("No contacts found matching your search criteria");
          return [];
        }
      } catch (err) {
        console.error('Error searching for contacts:', err);
        const errorMessage = err instanceof Error ? err.message : 'Could not search for contacts';
        setError(errorMessage);
        toast.error(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    });
    return result ?? [];
  };

  return {
    enrichProfile,
    searchPerson,
    enrichedData,
    searchResults,
    isLoading,
    error,
    totalResults,
    UsageLimitModalComponent,
    isLimitReached,
  };
};
