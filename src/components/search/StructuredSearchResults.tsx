
import React, { useState, useEffect, useCallback } from 'react';
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
import { CompactProfileCard } from './components/CompactProfileCard';
import { SearchSummaryHeader } from './components/SearchSummaryHeader';
import { SearchFiltersPanel } from './components/SearchFiltersPanel';
import { LayoutToggle, ViewMode, DensityMode } from './components/LayoutToggle';
import { Pagination } from './components/Pagination';
import { useSearchFilters } from './hooks/useSearchFilters';
import { cn } from '@/lib/utils';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const resultsPerPage = 25; // Google CSE API limit per request

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
  
  // Layout state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
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
      loadResults(1);
    }
  }, [searchString]);

  // Reset results when filters change (no need to reset page since we removed pagination)
  useEffect(() => {
    // Filters are applied client-side, no need to reload
  }, [filters]);

  const loadResults = async (page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await fetchSearchResults(
        searchString,
        page,
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
        setCurrentPage(page);
        
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

  const handlePageChange = (page: number) => {
    loadResults(page);
  };

  

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
        extraActions={
          <LayoutToggle
            viewMode={viewMode}
            densityMode={densityMode}
            onViewModeChange={setViewMode}
            onDensityModeChange={setDensityMode}
          />
        }
      />

      {/* Pagination */}
      {displayResults.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalResults / resultsPerPage)}
          onPageChange={handlePageChange}
        />
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
      <div className={cn(
        viewMode === 'grid' 
          ? cn(
              'grid',
              densityMode === 'compact' && 'gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
              densityMode === 'comfortable' && 'gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              densityMode === 'spacious' && 'gap-6 grid-cols-1 md:grid-cols-2'
            )
          : viewMode === 'list' 
            ? cn(
                densityMode === 'compact' && 'space-y-2',
                densityMode === 'comfortable' && 'space-y-3',
                densityMode === 'spacious' && 'space-y-4'
              )
            : cn(
                densityMode === 'compact' && 'space-y-1',
                densityMode === 'comfortable' && 'space-y-2',
                densityMode === 'spacious' && 'space-y-3'
              )
      )}>
        {displayResults.map((result, index) => {
          const isExpanded = expandedCard === result.link;
          
          if (viewMode === 'grid' || viewMode === 'list') {
            return (
              <CompactProfileCard
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
                onExpand={() => setExpandedCard(isExpanded ? null : result.link)}
                viewMode={viewMode}
              />
            );
          }
          
          // Compact view - use regular ProfileCard but in a modal/drawer
          return (
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
          );
        })}
      </div>

      
      
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
