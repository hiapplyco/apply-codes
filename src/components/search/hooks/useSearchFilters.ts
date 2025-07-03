import { useState, useMemo } from 'react';
import { SearchResult } from '../types';

export type LocationFilter = 'all' | string;
export type ExperienceFilter = 'all' | 'entry' | 'mid' | 'senior' | 'lead' | 'principal' | 'director' | 'manager';

export interface SearchFilters {
  location: LocationFilter;
  experience: ExperienceFilter;
}

export interface FilteredResults {
  filteredResults: SearchResult[];
  totalFiltered: number;
  locationOptions: string[];
  experienceDistribution: Record<ExperienceFilter, number>;
}

/**
 * Hook for managing search result filters
 */
export const useSearchFilters = (results: SearchResult[]) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: 'all',
    experience: 'all'
  });

  // Extract seniority level from job title
  const extractSeniorityLevel = (jobTitle?: string): ExperienceFilter => {
    if (!jobTitle) return 'mid';
    
    const title = jobTitle.toLowerCase();
    
    if (title.includes('intern') || title.includes('entry') || title.includes('junior') || title.includes('associate')) {
      return 'entry';
    }
    if (title.includes('senior') || title.includes('sr.') || title.includes('sr ')) {
      return 'senior';
    }
    if (title.includes('lead') || title.includes('staff')) {
      return 'lead';
    }
    if (title.includes('principal') || title.includes('architect')) {
      return 'principal';
    }
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      return 'director';
    }
    if (title.includes('manager') || title.includes('mgr')) {
      return 'manager';
    }
    
    return 'mid';
  };

  // Process and filter results
  const filteredData = useMemo<FilteredResults>(() => {
    // Extract unique locations (filter out empty/invalid locations)
    const locationOptions = Array.from(
      new Set(
        results
          .map(result => result.location)
          .filter(loc => loc && loc.trim() && !loc.toLowerCase().includes('unknown'))
          .map(loc => loc.trim())
      )
    ).sort();

    // Calculate experience distribution
    const experienceDistribution: Record<ExperienceFilter, number> = {
      all: results.length,
      entry: 0,
      mid: 0,
      senior: 0,
      lead: 0,
      principal: 0,
      director: 0,
      manager: 0
    };

    results.forEach(result => {
      const level = extractSeniorityLevel(result.jobTitle);
      experienceDistribution[level]++;
    });

    // Apply filters
    let filteredResults = results;

    // Location filter
    if (filters.location !== 'all') {
      filteredResults = filteredResults.filter(result => 
        result.location && 
        result.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Experience filter
    if (filters.experience !== 'all') {
      filteredResults = filteredResults.filter(result => 
        extractSeniorityLevel(result.jobTitle) === filters.experience
      );
    }

    return {
      filteredResults,
      totalFiltered: filteredResults.length,
      locationOptions,
      experienceDistribution
    };
  }, [results, filters]);

  const updateFilter = (key: keyof SearchFilters, value: LocationFilter | ExperienceFilter) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: 'all',
      experience: 'all'
    });
  };

  const hasActiveFilters = filters.location !== 'all' || filters.experience !== 'all';

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    ...filteredData
  };
};