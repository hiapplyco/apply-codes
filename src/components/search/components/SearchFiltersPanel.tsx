import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, MapPin, Briefcase, Users } from 'lucide-react';
import { 
  LocationFilter, 
  ExperienceFilter, 
  SearchFilters 
} from '../hooks/useSearchFilters';

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  locationOptions: string[];
  experienceDistribution: Record<ExperienceFilter, number>;
  onUpdateFilter: (key: keyof SearchFilters, value: LocationFilter | ExperienceFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
  filteredResults: number;
  onClose?: () => void;
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  filters,
  locationOptions,
  experienceDistribution,
  onUpdateFilter,
  onClearFilters,
  hasActiveFilters,
  totalResults,
  filteredResults,
  onClose
}) => {
  const experienceOptions: { value: ExperienceFilter; label: string; description: string }[] = [
    { value: 'all', label: 'All Experience Levels', description: 'Show all candidates' },
    { value: 'entry', label: 'Entry Level', description: 'Junior, Associate, Intern' },
    { value: 'mid', label: 'Mid Level', description: 'Standard experience level' },
    { value: 'senior', label: 'Senior Level', description: 'Senior, Sr. roles' },
    { value: 'lead', label: 'Lead/Staff', description: 'Lead, Staff engineer' },
    { value: 'principal', label: 'Principal/Architect', description: 'Principal, Architect roles' },
    { value: 'manager', label: 'Manager', description: 'Team manager roles' },
    { value: 'director', label: 'Director+', description: 'Director, VP level' }
  ];

  return (
    <Card className="border-2 border-purple-200 bg-white p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Filter Results</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {filteredResults} of {totalResults}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear All
            </Button>
          )}
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Location</label>
          </div>
          
          <Select
            value={filters.location}
            onValueChange={(value) => onUpdateFilter('location', value as LocationFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locationOptions.slice(0, 20).map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
              {locationOptions.length > 20 && (
                <SelectItem value="" disabled>
                  ... and {locationOptions.length - 20} more
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Experience Level</label>
          </div>
          
          <Select
            value={filters.experience}
            onValueChange={(value) => onUpdateFilter('experience', value as ExperienceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All experience levels" />
            </SelectTrigger>
            <SelectContent>
              {experienceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                    {option.value !== 'all' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {experienceDistribution[option.value]}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.location !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-700 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                {filters.location}
                <button
                  onClick={() => onUpdateFilter('location', 'all')}
                  className="ml-1 hover:bg-blue-200 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.experience !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-700 flex items-center gap-1"
              >
                <Briefcase className="w-3 h-3" />
                {experienceOptions.find(opt => opt.value === filters.experience)?.label}
                <button
                  onClick={() => onUpdateFilter('experience', 'all')}
                  className="ml-1 hover:bg-green-200 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};