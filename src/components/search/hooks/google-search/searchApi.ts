
import { functionBridge } from "@/lib/function-bridge";
import { toast } from "sonner";
import { SearchResult } from "../../types";
import { extractLocationFromSnippet } from "./utils";
import { GoogleSearchResult } from "./types";

/**
 * Processes raw search results into a standardized format
 */
export const processSearchResults = (data: GoogleSearchResult): SearchResult[] => {
  if (!data?.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: any) => ({
    ...item,
    name: item.title?.replace(/\s*\|\s.*$/, '') || item.title || '',
    location: extractLocationFromSnippet(item.snippet),
    jobTitle: item.snippet?.split('|')[0]?.trim() || '',
    profileUrl: item.link,
    relevance_score: undefined
  }));
};

/**
 * Fetches search results via the candidateSearch cloud function (Serper.dev).
 *
 * @deprecated Use functionBridge.candidateSearch() directly from MinimalSearchForm.
 * This wrapper exists for backward compatibility with the hooks system.
 */
export const fetchSearchResults = async (
  searchString: string,
  page: number,
  searchType: string,
  resultsPerPage: number
): Promise<{ data: GoogleSearchResult | null; error: Error | null }> => {
  try {
    const response = await functionBridge.candidateSearch({
      keywords: searchString,
      sources: ['linkedin', 'indeed', 'github'],
      page,
      resultsPerSource: resultsPerPage,
      useAIGeneration: false,
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Search failed');
    }

    // Map candidateSearch response to GoogleSearchResult shape for backward compatibility
    const items = response.data.merged.map((candidate: any) => ({
      title: `${candidate.name}${candidate.title ? ' | ' + candidate.title : ''}`,
      link: candidate.profileUrl,
      snippet: candidate.snippet,
      displayLink: candidate.profileUrl?.replace(/https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/') || '',
      name: candidate.name,
      location: candidate.location || extractLocationFromSnippet(candidate.snippet),
      jobTitle: candidate.title,
      profileUrl: candidate.profileUrl,
      source: candidate.source,
    }));

    return {
      data: {
        items,
        searchInformation: {
          totalResults: String(response.data.metadata.totalFound),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("[searchApi] Error fetching search results:", error);
    toast.error("Failed to fetch search results. Please try again.");
    return { data: null, error: error as Error };
  }
};
