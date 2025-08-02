
import { SearchResult, SearchType } from "../types";
import { useSearchState } from "./google-search/useSearchState";
import { useSearchInitialization } from "./google-search/useSearchInitialization";
import { useSearchActions } from "./google-search/useSearchActions";
import { useSearchStorage } from "./google-search/useSearchStorage";

/**
 * Main hook that combines all Google search functionality
 */
export const useGoogleSearch = (
  initialSearchString: string,
  searchType: SearchType = "candidates",
  jobId?: number,
  resultsPerPage: number = 10
) => {
  
  // State management
  const { state, setState } = useSearchState(initialSearchString);
  const { results, isLoading, searchString, currentPage, totalResults, error } = state;
  
  // Storage management for job results
  const { getStoredResults, saveResults, appendResults } = useSearchStorage(
    jobId, 
    results, 
    searchString, 
    totalResults
  );

  // Initialize from props and stored data
  useSearchInitialization(
    initialSearchString,
    searchString,
    getStoredResults,
    saveResults,
    setState,
    jobId,
    resultsPerPage
  );

  // Search actions
  const { 
    handleSearch, 
    handleLoadMore, 
    handleCopySearchString, 
    handleExport,
    setSearchString 
  } = useSearchActions(
    searchString,
    setState,
    results,
    saveResults,
    appendResults,
    currentPage,
    searchType,
    jobId,
    resultsPerPage
  );

  return { 
    results, 
    isLoading, 
    searchString, 
    setSearchString, 
    handleSearch, 
    handleLoadMore, 
    handleCopySearchString, 
    handleExport,
    currentPage,
    totalResults,
    error
  };
};
