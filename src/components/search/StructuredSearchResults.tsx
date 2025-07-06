
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchSearchResults, processSearchResults } from './hooks/google-search/searchApi';
import { SearchResult } from './types';
import { toast } from 'sonner';
import { useProfileEnrichment } from './hooks/useProfileEnrichment';
import { ContactSearchModal } from './ContactSearchModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProfileCard } from './components/ProfileCard';
import { SearchSummaryHeader } from './components/SearchSummaryHeader';
import { SearchFiltersPanel } from './components/SearchFiltersPanel';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { LoadMoreButton } from './components/LoadMoreButton';

export interface StructuredSearchResultsProps {
  searchString: string;
  searchType?: string;
  jobId?: number;
}

export const StructuredSearchResults: React.FC<StructuredSearchResultsProps> = ({
  searchString,
  searchType = 'candidates',
  jobId
}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const resultsPerPage = 10;

  // Store enriched contact data per profile URL
  const [enrichedProfiles, setEnrichedProfiles] = useState<Record<string, any>>({});
  const [loadingProfiles, setLoadingProfiles] = useState<Set<string>>(new Set());
  
  // Contact search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalParams, setSearchModalParams] = useState<{ name?: string; company?: string; location?: string }>({});
  
  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  
  // Omitted profiles state
  const [omittedProfiles, setOmittedProfiles] = useState<Set<string>>(new Set());
  
  // Use search filters hook
  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    filteredResults,
    totalFiltered,
    locationOptions,
    experienceDistribution
  } = useSearchFilters(results);
  
  // For infinite scroll, we show all filtered results (no pagination slice), excluding omitted profiles
  const displayResults = filteredResults.filter(result => !omittedProfiles.has(result.link));
  
  // Use the profile enrichment hook
  const { enrichProfile } = useProfileEnrichment();

  useEffect(() => {
    if (searchString) {
      resetAndLoadResults();
    }
  }, [searchString, resetAndLoadResults]);

  // Reset results when filters change (no need to reset page since we removed pagination)
  useEffect(() => {
    // Filters are applied client-side, no need to reload
  }, [filters]);

  const resetAndLoadResults = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentPage(1);
    setHasReachedEnd(false);
    
    try {
      const { data, error } = await fetchSearchResults(
        searchString,
        1,
        searchType,
        resultsPerPage
      );

      if (error) {
        console.error('Error fetching results:', error);
        setError('Failed to fetch search results');
        toast.error('Failed to fetch search results');
        return;
      }

      if (data) {
        const processedResults = processSearchResults(data);
        setResults(processedResults);
        setTotalResults(parseInt(data.searchInformation?.totalResults || '0'));
        setCurrentPage(1);
        
        // Check if we've reached the end (Google CSE has a limit)
        if (processedResults.length < resultsPerPage) {
          setHasReachedEnd(true);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setError('Failed to load search results');
      toast.error('Failed to load search results');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreResults = async () => {
    if (isLoadingMore || hasReachedEnd) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const { data, error } = await fetchSearchResults(
        searchString,
        nextPage,
        searchType,
        resultsPerPage
      );

      if (error) {
        console.error('Error fetching more results:', error);
        toast.error('Failed to load more results');
        return;
      }

      if (data) {
        const processedResults = processSearchResults(data);
        
        // Check if we got fewer results than expected (reached end)
        if (processedResults.length < resultsPerPage) {
          setHasReachedEnd(true);
        }
        
        // Append new results to existing ones
        setResults(prev => [...prev, ...processedResults]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more results:', error);
      toast.error('Failed to load more results');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate if we have more results to load
  const hasMore = !hasReachedEnd && results.length < totalResults;
  
  // Set up infinite scroll
  const { ref: infiniteScrollRef } = useInfiniteScroll({
    onLoadMore: loadMoreResults,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 0.1,
    rootMargin: '200px'
  });

  const handleGetContactInfo = async (profileUrl: string, profileName: string) => {
    try {
      console.log('Getting contact info for:', profileUrl, profileName);
      
      // Check if we already have this profile's data
      if (enrichedProfiles[profileUrl]) {
        return enrichedProfiles[profileUrl];
      }
      
      // Mark as loading
      setLoadingProfiles(prev => new Set([...prev, profileUrl]));
      
      // Enrich the profile
      const result = await enrichProfile(profileUrl);
      console.log('Enrichment result:', result);
      
      // Store the result (even if null to avoid re-fetching)
      setEnrichedProfiles(prev => ({ ...prev, [profileUrl]: result }));
      
      return result;
    } catch (error) {
      console.error('Error getting contact info:', error);
      toast.error('Failed to get contact information');
      return null;
    } finally {
      // Remove from loading set
      setLoadingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileUrl);
        return newSet;
      });
    }
  };

  const handleSearchContacts = (name: string, company: string, location: string) => {
    console.log('Opening search modal with:', { name, company, location });
    setSearchModalParams({ name, company, location });
    setIsSearchModalOpen(true);
  };

  const handleExport = () => {
    // Mock export functionality
    toast.success('Export functionality will be implemented');
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleOmitProfile = (profileId: string) => {
    setOmittedProfiles(prev => {
      const newSet = new Set(prev);
      newSet.add(profileId);
      return newSet;
    });
  };

  // Loading state
  if (isLoading && results.length === 0) {
    return (
      <Card className="p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span className="text-lg">Searching LinkedIn profiles...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error && results.length === 0) {
    return (
      <Card className="p-8 border-2 border-red-200 bg-red-50">
        <div className="flex items-center justify-center text-red-700">
          <AlertCircle className="w-8 h-8 mr-2" />
          <div>
            <h3 className="font-semibold">Search Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  // No results state
  if (!isLoading && results.length === 0) {
    return (
      <Card className="p-8 border-2 border-gray-200">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-semibold text-lg mb-2">No Profiles Found</h3>
          <p>Try adjusting your search criteria or search terms.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Summary Header */}
      <SearchSummaryHeader
        totalResults={hasActiveFilters ? totalFiltered : totalResults}
        currentPage={1}
        resultsPerPage={displayResults.length} // Show actual loaded results
        searchQuery={searchString}
        onExport={handleExport}
        onFilter={handleFilter}
      />

      {/* Pagination Status */}
      {displayResults.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{displayResults.length}</span> of{' '}
            <span className="font-semibold">{totalResults.toLocaleString()}</span> profiles
            {hasMore && <span className="text-purple-600 ml-2">• More available</span>}
          </div>
          {hasMore && (
            <div className="text-xs text-gray-500">
              Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
            </div>
          )}
        </div>
      )}

      {/* Search Filters Panel */}
      {showFilters && (
        <SearchFiltersPanel
          filters={filters}
          locationOptions={locationOptions}
          experienceDistribution={experienceDistribution}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          totalResults={totalResults}
          filteredResults={totalFiltered}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Results Grid */}
      <div className="space-y-3">
        {displayResults.map((result, index) => (
          <ProfileCard
            key={`${result.link}-${index}`}
            result={result}
            index={index}
            onGetContactInfo={handleGetContactInfo}
            onSearchContacts={handleSearchContacts}
            contactInfo={enrichedProfiles[result.link]}
            isLoadingContact={loadingProfiles.has(result.link)}
            jobId={jobId}
            searchString={searchString}
            onOmit={handleOmitProfile}
            isOmitted={omittedProfiles.has(result.link)}
          />
        ))}
      </div>

      {/* Infinite Scroll Indicators */}
      {hasMore && (
        <div ref={infiniteScrollRef} className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600">
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more results...</span>
              </>
            ) : (
              <span className="text-sm">Scroll down for more results</span>
            )}
          </div>
        </div>
      )}

      {/* Manual Load More Button */}
      {hasMore && !isLoadingMore && (
        <LoadMoreButton 
          onClick={loadMoreResults}
          isLoading={isLoadingMore}
        />
      )}
      
      {hasReachedEnd && displayResults.length > 0 && (
        <div className="flex justify-center py-4">
          <span className="text-sm text-gray-500">No more results to load</span>
        </div>
      )}

      {/* Contact Search Modal */}
      <ErrorBoundary>
        <ContactSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => {
            setIsSearchModalOpen(false);
            setSearchModalParams({});
          }}
          initialSearchParams={searchModalParams}
        />
      </ErrorBoundary>
    </div>
  );
};

export default StructuredSearchResults;
