
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchResult } from "../../types";
import { extractLocationFromSnippet, prepareSearchString, validateLinkedInUrl } from "./utils";
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
    relevance_score: undefined // Removed arbitrary score
  }));
};

/**
 * Fetches search results from Google Custom Search Engine
 */
export const fetchSearchResults = async (
  searchString: string,
  page: number,
  searchType: string,
  resultsPerPage: number
): Promise<{ data: GoogleSearchResult | null; error: Error | null }> => {
  try {
    const startIndex = (page - 1) * resultsPerPage + 1;
    
    console.log(`🔍 [DEBUG] Fetching search results for: "${searchString}" (page ${page})`);
    console.log(`🔍 [DEBUG] Search type: ${searchType}, resultsPerPage: ${resultsPerPage}, startIndex: ${startIndex}`);
    
    // Get the CSE API key from Supabase Edge Function
    console.log("🔍 [DEBUG] Retrieving Google CSE API key from Supabase Edge Function");
    const { data: keyData, error: keyError } = await supabase.functions.invoke('get-google-cse-key');
    
    if (keyError) {
      console.error("❌ [ERROR] Error fetching CSE key:", keyError);
      console.error("❌ [ERROR] Error details:", JSON.stringify(keyError));
      toast.error(`Failed to get Google CSE API key: ${keyError.message}`);
      throw keyError;
    }
    
    if (!keyData || !keyData.key) {
      console.error("❌ [ERROR] No CSE key returned from function:", keyData);
      toast.error("Failed to get Google CSE API key");
      throw new Error("Failed to get Google CSE API key");
    }
    
    console.log("✅ [SUCCESS] CSE key received:", keyData.key ? "Key exists (length: " + keyData.key.length + ")" : "No key");
    console.log("✅ [SUCCESS] CSE key debug info:", keyData.debug);
    
    // Ensure the search string includes site:linkedin.com/in/ for candidate searches
    const finalSearchString = prepareSearchString(searchString, searchType);
    console.log("🔍 [CRITICAL] Final search string with site restriction:", finalSearchString);
    
    // Use the correct CSE ID for Google Custom Search Engine
    const cseId = keyData.debug?.cseId || 'b28705633bcb44cf0'; // Use the CSE ID from the server if available
    console.log("🔍 [CRITICAL] Using CSE ID:", cseId);
    
    // Make request to Google CSE API with the properly formatted search string
    const cseUrl = `https://www.googleapis.com/customsearch/v1?key=${keyData.key}&cx=${cseId}&q=${encodeURIComponent(
      finalSearchString
    )}&start=${startIndex}`;
    
    console.log("🔍 [CRITICAL] Making CSE request with full search constraints");
    
    const response = await fetch(cseUrl);
    console.log("🔍 [DEBUG] CSE API response status:", response.status);
    
    // Get the raw response text
    const responseText = await response.text();
    console.log("🔍 [DEBUG] CSE API response length:", responseText.length);
    
    if (!response.ok) {
      console.error(`❌ [ERROR] CSE API response not OK: ${response.status}`, responseText.substring(0, 500));
      toast.error(`Google CSE API error: ${response.status}`);
      throw new Error(`Google CSE API error: ${response.status} - ${responseText.substring(0, 500)}`);
    }
    
    try {
      const responseData = JSON.parse(responseText);
      console.log("✅ [SUCCESS] Parsed search API response - items count:", responseData.items?.length || 0);
      console.log("🔍 [DEBUG] Total results reported:", responseData.searchInformation?.totalResults || 0);
      
      // Check if we have search results and transform them into the correct format
      if (responseData && responseData.items && responseData.items.length > 0) {
        console.log("✅ [SUCCESS] Search returned results:", responseData.items.length);
        
        const transformedItems = responseData.items.map((item: any) => {
          // Extract name from title (usually "Name | LinkedIn" or "Name - Title | LinkedIn")
          const name = item.title.replace(/\s*[\|\-]\s*LinkedIn.*$/i, '').split(/\s*[\|\-]\s*/)[0].trim();
          
          // Extract job title from snippet
          let jobTitle = '';
          const snippet = item.snippet || '';
          
          // Remove name from beginning of snippet if present
          let cleanSnippet = snippet;
          if (cleanSnippet.toLowerCase().startsWith(name.toLowerCase())) {
            cleanSnippet = cleanSnippet.substring(name.length).replace(/^[\s·\-]+/, '');
          }
          
          // Common patterns for job title extraction
          if (cleanSnippet.match(/^([^·\-]+?)\s+at\s+/)) {
            // Pattern: "Job Title at Company"
            jobTitle = cleanSnippet.match(/^([^·\-]+?)\s+at\s+/)?.[1]?.trim() || '';
          } else if (cleanSnippet.includes(' - ')) {
            // Pattern: "Job Title - Company"
            jobTitle = cleanSnippet.split(' - ')[0].trim();
          } else if (cleanSnippet.includes(' · ')) {
            // First part before · is usually job/title info
            jobTitle = cleanSnippet.split(' · ')[0].trim();
          } else {
            // Fallback: take first part of snippet
            jobTitle = cleanSnippet.split(/[·\-]/)[0].trim();
          }
          
          // Validate LinkedIn URL before using
          const validatedUrl = validateLinkedInUrl(item.link);
          
          return {
            ...item,
            name,
            location: extractLocationFromSnippet(item.snippet),
            jobTitle,
            profileUrl: validatedUrl
          };
        });
        
        return { 
          data: {
            items: transformedItems,
            searchInformation: responseData.searchInformation
          }, 
          error: null 
        };
      } else {
        console.log("ℹ️ [INFO] No items in search results:", responseData);
        // Return empty results instead of throwing an error
        return { 
          data: {
            items: [],
            searchInformation: {
              totalResults: "0"  // This matches the type now
            }
          }, 
          error: null 
        };
      }
    } catch (parseError) {
      console.error("❌ [ERROR] Error parsing CSE API response:", parseError);
      toast.error(`Failed to parse search results: ${parseError.message}`);
      throw new Error(`Failed to parse CSE API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("❌ [ERROR] Error fetching search results:", error);
    toast.error("Failed to fetch search results. Please try again.");
    return { data: null, error: error as Error };
  }
};
