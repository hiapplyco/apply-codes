
import { AlertCircle, Loader2, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchResultItem } from "./SearchResultItem";
import { SearchResultsListProps } from "../types";

export const SearchResultsList = ({
  results,
  isLoading,
  totalResults,
  currentResults,
  onLoadMore,
  isLoadingMore,
  searchType
}: SearchResultsListProps) => {
  const hasMoreResults = totalResults && Number(totalResults) > (currentResults || results.length);
  const remainingResults = totalResults ? Math.min(Number(totalResults) - (currentResults || results.length), 10) : 0;

  return (
    <div className="space-y-3">
      {/* Results Header */}
      {results.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pb-2 border-b border-gray-100">
          <span>
            Showing {currentResults || results.length} of {totalResults || results.length} results
          </span>
          {hasMoreResults && (
            <span className="text-purple-600 font-medium">
              {remainingResults}+ more available
            </span>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 mb-3 animate-spin text-purple-500" />
          <p className="text-sm font-medium">Searching for candidates...</p>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50">
          <AlertCircle className="w-8 h-8 mb-3 text-amber-500" />
          <p className="text-sm font-medium mb-1">No results found</p>
          <p className="text-xs text-gray-400 mb-4 text-center max-w-xs">
            Try adjusting your search terms or modifying the boolean query.
          </p>
          <Button
            onClick={() => onLoadMore()}
            variant="outline"
            size="sm"
            className="border-gray-200 hover:bg-white"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid gap-3">
          {results.map((result, index) => (
            <SearchResultItem
              key={`${result.link || result.profileUrl}-${index}`}
              result={result}
              searchType={searchType}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {results.length > 0 && hasMoreResults && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Load {remainingResults} More Results
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
