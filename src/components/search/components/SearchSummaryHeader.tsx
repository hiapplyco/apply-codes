
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MapPin, 
  Briefcase, 
  Download, 
  Filter,
  Search,
  TrendingUp
} from 'lucide-react';

interface SearchSummaryHeaderProps {
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  searchQuery?: string;
  onExport?: () => void;
  onFilter?: () => void;
  extraActions?: React.ReactNode;
}

export const SearchSummaryHeader: React.FC<SearchSummaryHeaderProps> = ({
  totalResults,
  currentPage,
  resultsPerPage,
  searchQuery,
  onExport,
  onFilter,
  extraActions
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  // Mock analytics based on search patterns
  const getSearchInsights = () => {
    const insights = [];
    
    if (searchQuery?.toLowerCase().includes('senior')) {
      insights.push({ label: 'Senior Roles', count: Math.floor(totalResults * 0.6) });
    }
    if (searchQuery?.toLowerCase().includes('remote')) {
      insights.push({ label: 'Remote Friendly', count: Math.floor(totalResults * 0.4) });
    }
    if (searchQuery?.toLowerCase().includes('engineer')) {
      insights.push({ label: 'Engineering', count: Math.floor(totalResults * 0.8) });
    }
    
    return insights;
  };

  const insights = getSearchInsights();

  return (
    <Card className="p-4 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                LinkedIn Profile Results
              </h3>
              <p className="text-sm text-gray-600">
                Showing {startResult}-{endResult} of {totalResults.toLocaleString()} profiles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extraActions}
          
          {onFilter && (
            <Button
              size="sm"
              variant="outline"
              onClick={onFilter}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          )}
          
          {onExport && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Search Insights */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Quick Insights:</span>
          </div>
          {insights.map((insight, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {insight.label}: {insight.count}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Query Display */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 p-2 rounded">
          <Search className="w-4 h-4" />
          <span className="font-medium">Search:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
            {searchQuery.length > 100 ? `${searchQuery.substring(0, 100)}...` : searchQuery}
          </code>
        </div>
      )}
    </Card>
  );
};
