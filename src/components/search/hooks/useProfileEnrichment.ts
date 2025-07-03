
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  // State management
  const [enrichedData, setEnrichedData] = useState<EnrichedProfileData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  /**
   * Enriches a single LinkedIn profile using the profile URL
   * @param profileUrl The LinkedIn profile URL to enrich
   * @returns The enriched profile data or null if an error occurs
   */
  const enrichProfile = async (profileUrl: string): Promise<EnrichedProfileData | null> => {
    try {
      // Reset states
      setIsLoading(true);
      setError(null);
      
      // Show loading toast with ID so we can dismiss it properly
      const toastId = toast.loading("Fetching contact information...");
      
      // Call Supabase Edge Function
      const response = await supabase.functions.invoke('get-contact-info', {
        body: {
          profileUrl
        }
      });
      
      console.log('Edge function response:', response);
      
      const { data, error: supabaseError } = response;
      
      // Dismiss the specific loading toast
      toast.dismiss(toastId);
      
      // Handle Supabase error
      if (supabaseError) {
        console.error('Supabase function error:', supabaseError);
        throw new Error(`Failed to enrich profile: ${supabaseError.message}`);
      }
      
      // Handle successful response from updated edge function
      console.log('Nymeria API Response:', data);
      
      // Check if the response contains an error (old format compatibility)
      if (data?.error && !data?.success) {
        console.error('API returned error:', data);
        const errorMsg = data.suggestion 
          ? `${data.error}. ${data.suggestion}`
          : data.error;
        throw new Error(errorMsg);
      }
      
      // Handle new structured response format
      if (data?.success !== undefined) {
        const enrichmentResponse = data as EnrichmentResponse;
        
        if (enrichmentResponse.success && enrichmentResponse.data) {
          // Profile found and enriched
          // Extract the actual profile data from the nested structure
          const profileData = enrichmentResponse.data.data || enrichmentResponse.data;
          console.log('Setting enriched data:', profileData);
          setEnrichedData(profileData);
          toast.success('Contact information retrieved');
          return profileData;
        } else if (enrichmentResponse.success && !enrichmentResponse.data) {
          // Profile not found in Nymeria (404 case)
          console.log('Profile not found in contact database');
          toast.info("No contact information available for this profile");
          setEnrichedData(null);
          return null;
        }
      }
      
      // Fallback for old response format
      if (data) {
        const profileData = data.data || data;
        console.log('Setting enriched data (fallback):', profileData);
        setEnrichedData(profileData);
        toast.success('Contact information retrieved');
        return profileData;
      } else {
        // No data returned
        toast.info("No contact information available for this profile");
        return null;
      }
    } catch (err) {
      // Log and handle errors
      console.error('Error enriching profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not retrieve contact information';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  /**
   * Searches for persons matching the provided search parameters
   * @param params The search parameters to use
   * @returns An array of search results or an empty array if an error occurs
   */
  const searchPerson = async (params: PersonSearchParams): Promise<SearchResult[]> => {
    try {
      // Reset states
      setIsLoading(true);
      setError(null);
      setSearchResults([]);
      
      // Show loading toast
      toast.loading("Searching for contact information...");
      
      // Call Supabase Edge Function
      const { data, error: supabaseError } = await supabase.functions.invoke('enrich-profile', {
        body: {
          searchParams: params
        }
      });
      
      // Dismiss loading toast
      toast.dismiss();
      
      // Handle Supabase error
      if (supabaseError) {
        throw new Error(`Failed to search for contacts: ${supabaseError.message}`);
      }
      
      // Handle successful response
      if (data?.data && data.data.length > 0) {
        setSearchResults(data.data);
        setTotalResults(data.total || data.data.length);
        return data.data;
      } else {
        // No results found
        toast.error("No contacts found matching your search criteria");
        return [];
      }
    } catch (err) {
      // Log and handle errors
      console.error('Error searching for contacts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not search for contacts';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // Return the hook interface
  return { 
    enrichProfile, 
    searchPerson, 
    enrichedData, 
    searchResults, 
    isLoading, 
    error,
    totalResults
  };
};
