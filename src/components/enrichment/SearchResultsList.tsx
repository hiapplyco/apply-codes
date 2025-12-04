/**
 * List component to display search results from name search
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building2,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  ChevronRight
} from 'lucide-react';
import { SearchResult } from './types';

interface SearchResultsListProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  isLoading?: boolean;
}

const SearchResultsList = memo(({ results, onSelect, isLoading }: SearchResultsListProps) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Search Results ({results.length})
        </h3>
        <p className="text-sm text-gray-500">
          Click a result to view contact details
        </p>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => {
          const name = result.name ||
            `${result.first_name || ''} ${result.last_name || ''}`.trim() ||
            'Unknown';
          const hasContact = result.work_email || result.personal_emails?.length || result.mobile_phone;

          return (
            <Card
              key={result.uuid || index}
              className="border-2 border-gray-200 hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => onSelect(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold border-2 border-gray-300">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{name}</span>
                        {hasContact && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            Contact Available
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        {result.job_title && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {result.job_title}
                          </span>
                        )}
                        {result.job_company_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {result.job_company_name}
                          </span>
                        )}
                        {result.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {result.location}
                          </span>
                        )}
                      </div>

                      {/* Quick contact preview */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {result.work_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {result.work_email}
                          </span>
                        )}
                        {result.mobile_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {result.mobile_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="text-purple-600">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

SearchResultsList.displayName = 'SearchResultsList';

export default SearchResultsList;
