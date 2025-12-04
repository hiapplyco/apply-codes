/**
 * Hook for profile enrichment operations
 * Supports enrichment by LinkedIn URL/username, email, and name search
 */

import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { functionBridge } from "@/lib/function-bridge";
import {
  EnrichedProfileData,
  NameSearchParams,
  SearchResult,
  EnrichmentHistoryItem,
  EnrichmentInputType
} from '@/components/enrichment/types';

// Generate a unique ID for history items
const generateId = () => `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Maximum history items to keep
const MAX_HISTORY_ITEMS = 10;

export const useEnrichment = () => {
  // State management
  const [enrichedData, setEnrichedData] = useState<EnrichedProfileData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EnrichmentHistoryItem[]>([]);

  /**
   * Add an item to enrichment history
   */
  const addToHistory = useCallback((
    inputType: EnrichmentInputType,
    inputValue: string,
    displayName: string,
    result: EnrichedProfileData | null,
    success: boolean
  ) => {
    const historyItem: EnrichmentHistoryItem = {
      id: generateId(),
      inputType,
      inputValue,
      displayName,
      result,
      timestamp: new Date().toISOString(),
      success
    };

    setHistory(prev => [historyItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
  }, []);

  /**
   * Clear enrichment history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Reset current result state
   */
  const resetResult = useCallback(() => {
    setEnrichedData(null);
    setSearchResults([]);
    setError(null);
  }, []);

  /**
   * Enrich a profile by LinkedIn URL or username
   * Normalizes username to full URL if needed
   */
  const enrichByLinkedIn = useCallback(async (input: string): Promise<EnrichedProfileData | null> => {
    try {
      setIsLoading(true);
      setError(null);
      resetResult();

      // Normalize input: if not a URL, construct it
      let profileUrl = input.trim();
      if (!profileUrl.includes('linkedin.com')) {
        // Remove @ if present and construct URL
        const username = profileUrl.replace(/^@/, '').replace(/\//g, '');
        profileUrl = `https://linkedin.com/in/${username}`;
      } else if (!profileUrl.startsWith('http')) {
        profileUrl = `https://${profileUrl}`;
      }

      const toastId = toast.loading("Looking up LinkedIn profile...");

      const data = await functionBridge.getContactInfo({ profileUrl });

      toast.dismiss(toastId);

      // Check for error response
      if (data?.error && !data?.enriched) {
        throw new Error(data.error);
      }

      // Handle successful response
      if (data?.enriched || data?.work_email || data?.personal_emails?.length > 0 || data?.mobile_phone) {
        const profileData = data.data || data;
        setEnrichedData(profileData);

        const displayName = profileData.name || input;
        addToHistory('linkedin', input, displayName, profileData, true);

        toast.success('Contact information found');
        return profileData;
      } else if (data?.message?.includes('No contact information')) {
        toast.info("No contact information available for this profile");
        addToHistory('linkedin', input, input, null, false);
        return null;
      }

      // Fallback: treat response as profile data
      if (data) {
        const profileData = data.data || data;
        setEnrichedData(profileData);
        addToHistory('linkedin', input, profileData.name || input, profileData, true);
        toast.success('Profile enriched');
        return profileData;
      }

      return null;
    } catch (err) {
      console.error('Error enriching LinkedIn profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not retrieve contact information';
      setError(errorMessage);
      toast.error(errorMessage);
      addToHistory('linkedin', input, input, null, false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [resetResult, addToHistory]);

  /**
   * Enrich a profile by email address
   */
  const enrichByEmail = useCallback(async (email: string): Promise<EnrichedProfileData | null> => {
    try {
      setIsLoading(true);
      setError(null);
      resetResult();

      const toastId = toast.loading("Looking up email address...");

      // Use the enrichProfile callable function with email parameter
      const data = await functionBridge.enrichProfile({
        searchParams: { email: email.trim().toLowerCase() }
      });

      toast.dismiss(toastId);

      // Handle response
      if (data?.success && data?.data) {
        // If data is an array (search results), take the first one
        const profileData = Array.isArray(data.data) ? data.data[0] : data.data;

        if (profileData) {
          setEnrichedData(profileData);
          const displayName = profileData.name ||
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
            email;
          addToHistory('email', email, displayName, profileData, true);
          toast.success('Contact information found');
          return profileData;
        }
      }

      // No results
      toast.info("No profile found for this email address");
      addToHistory('email', email, email, null, false);
      return null;
    } catch (err) {
      console.error('Error enriching by email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not look up email address';
      setError(errorMessage);
      toast.error(errorMessage);
      addToHistory('email', email, email, null, false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [resetResult, addToHistory]);

  /**
   * Search for people by name and optional fields
   * Returns multiple results that the user can select from
   */
  const searchByName = useCallback(async (params: NameSearchParams): Promise<SearchResult[]> => {
    try {
      setIsLoading(true);
      setError(null);
      setSearchResults([]);
      setEnrichedData(null);

      const toastId = toast.loading("Searching for contacts...");

      // Call search contacts function
      const response = await functionBridge.searchContacts({
        searchParams: {
          first_name: params.firstName.trim(),
          last_name: params.lastName.trim(),
          company: params.company?.trim() || undefined,
          title: params.title?.trim() || undefined,
          location: params.location?.trim() || undefined,
          industry: params.industry?.trim() || undefined,
          limit: 10
        }
      });

      toast.dismiss(toastId);

      // Handle response
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        setSearchResults(response.data);

        const searchDisplay = `${params.firstName} ${params.lastName}${params.company ? ` at ${params.company}` : ''}`;
        toast.success(`Found ${response.data.length} result${response.data.length > 1 ? 's' : ''}`);

        return response.data;
      }

      // No results
      toast.info("No contacts found matching your search");
      const searchDisplay = `${params.firstName} ${params.lastName}`;
      addToHistory('name', searchDisplay, searchDisplay, null, false);
      return [];
    } catch (err) {
      console.error('Error searching by name:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not search for contacts';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory]);

  /**
   * Select a search result to view as the enriched data
   */
  const selectSearchResult = useCallback((result: SearchResult) => {
    // Convert SearchResult to EnrichedProfileData format
    const enrichedProfile: EnrichedProfileData = {
      name: result.name || `${result.first_name || ''} ${result.last_name || ''}`.trim(),
      work_email: result.work_email,
      personal_emails: result.personal_emails,
      mobile_phone: result.mobile_phone,
      job_title: result.job_title,
      job_company_name: result.job_company_name,
      location: result.location,
      country: result.country,
      industry: result.industry
    };

    setEnrichedData(enrichedProfile);

    const displayName = enrichedProfile.name || 'Unknown';
    addToHistory('name', displayName, displayName, enrichedProfile, true);
  }, [addToHistory]);

  return {
    // Enrichment methods
    enrichByLinkedIn,
    enrichByEmail,
    searchByName,
    selectSearchResult,

    // State
    enrichedData,
    searchResults,
    isLoading,
    error,
    history,

    // Actions
    clearHistory,
    resetResult
  };
};
