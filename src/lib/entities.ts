// Utility functions for working with normalized entities
// Supports the canonical entity management system from Phase 2.1

import { supabase } from '@/integrations/supabase/client';
import type { 
  CompanyEntity, 
  LocationEntity, 
  CompanyNormalizationResult, 
  LocationNormalizationResult,
  SeniorityLevel 
} from '@/types/domains/entities';

// =====================================================
// COMPANY NORMALIZATION FUNCTIONS
// =====================================================

export async function findOrCreateCompany(
  companyName: string,
  domain?: string,
  industry?: string
): Promise<CompanyNormalizationResult> {
  if (!companyName?.trim()) {
    throw new Error('Company name is required');
  }

  const normalizedName = companyName.trim();

  try {
    // First, try to find existing company by canonical name or alias
    const { data: existingCompany, error: searchError } = await supabase
      .from('companies')
      .select('id, canonical_name')
      .or(`canonical_name.eq.${normalizedName},aliases.cs.{${normalizedName}}`)
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw searchError;
    }

    if (existingCompany) {
      return {
        company_id: existingCompany.id,
        canonical_name: existingCompany.canonical_name,
        was_created: false
      };
    }

    // Company doesn't exist, create new one
    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert({
        canonical_name: normalizedName,
        domain,
        industry,
        aliases: []
      })
      .select('id, canonical_name')
      .single();

    if (createError) {
      throw createError;
    }

    return {
      company_id: newCompany.id,
      canonical_name: newCompany.canonical_name,
      was_created: true
    };
  } catch (error) {
    console.error('Error in findOrCreateCompany:', error);
    throw error;
  }
}

export async function addCompanyAlias(companyId: string, alias: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({
      aliases: supabase.sql`array_append(aliases, ${alias})`
    })
    .eq('id', companyId);

  if (error) {
    throw error;
  }
}

export async function searchCompanies(query: string, limit = 10): Promise<CompanyEntity[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .or(`canonical_name.ilike.%${query}%,aliases.cs.{${query}}`)
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

// =====================================================
// LOCATION NORMALIZATION FUNCTIONS
// =====================================================

export async function findOrCreateLocation(
  locationString: string
): Promise<LocationNormalizationResult> {
  if (!locationString?.trim()) {
    throw new Error('Location string is required');
  }

  const canonicalName = locationString.trim();
  const locationParts = canonicalName.split(',').map(part => part.trim());

  const parsedCity = locationParts[0] || '';
  const parsedState = locationParts[1] || undefined;
  const parsedCountry = locationParts[2] || 'United States';

  try {
    // First, try to find existing location
    const { data: existingLocation, error: searchError } = await supabase
      .from('locations')
      .select('id, canonical_name, city, state, country')
      .or(`canonical_name.eq.${canonicalName},aliases.cs.{${canonicalName}}`)
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingLocation) {
      return {
        location_id: existingLocation.id,
        canonical_name: existingLocation.canonical_name,
        parsed_city: existingLocation.city,
        parsed_state: existingLocation.state,
        parsed_country: existingLocation.country,
        was_created: false
      };
    }

    // Location doesn't exist, create new one
    const { data: newLocation, error: createError } = await supabase
      .from('locations')
      .insert({
        canonical_name: canonicalName,
        city: parsedCity,
        state: parsedState,
        country: parsedCountry,
        aliases: []
      })
      .select('id, canonical_name, city, state, country')
      .single();

    if (createError) {
      throw createError;
    }

    return {
      location_id: newLocation.id,
      canonical_name: newLocation.canonical_name,
      parsed_city: newLocation.city,
      parsed_state: newLocation.state,
      parsed_country: newLocation.country,
      was_created: true
    };
  } catch (error) {
    console.error('Error in findOrCreateLocation:', error);
    throw error;
  }
}

export async function addLocationAlias(locationId: string, alias: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({
      aliases: supabase.sql`array_append(aliases, ${alias})`
    })
    .eq('id', locationId);

  if (error) {
    throw error;
  }
}

export async function searchLocations(query: string, limit = 10): Promise<LocationEntity[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .or(`canonical_name.ilike.%${query}%,city.ilike.%${query}%,aliases.cs.{${query}}`)
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

// =====================================================
// EXPERIENCE AND SENIORITY UTILITIES
// =====================================================

export function extractExperienceYears(
  jobTitle?: string, 
  profileSummary?: string
): number | null {
  const text = `${jobTitle || ''} ${profileSummary || ''}`.toLowerCase();
  
  // Look for patterns like "5+ years", "3-5 years", "10 years experience"
  const yearPattern = /(\d+)[\+\-\s]*years?/g;
  const matches = text.match(yearPattern);
  
  if (matches && matches.length > 0) {
    // Extract the first number found
    const numbers = matches[0].match(/\d+/);
    if (numbers) {
      const years = parseInt(numbers[0], 10);
      return Math.min(30, Math.max(0, years)); // Cap between 0-30 years
    }
  }
  
  // Fallback to title-based estimation
  if (jobTitle) {
    const titleLower = jobTitle.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('sr')) return 7;
    if (titleLower.includes('lead') || titleLower.includes('principal')) return 10;
    if (titleLower.includes('junior') || titleLower.includes('jr')) return 2;
    if (titleLower.includes('intern') || titleLower.includes('entry')) return 0;
    if (titleLower.includes('director') || titleLower.includes('vp')) return 12;
  }
  
  return 5; // Default assumption
}

export function determineSeniorityLevel(
  experienceYears?: number,
  jobTitle?: string
): SeniorityLevel {
  const titleLower = jobTitle?.toLowerCase() || '';
  
  // Check explicit seniority indicators in title first
  if (titleLower.includes('intern') || titleLower.includes('trainee')) {
    return 'Intern';
  }
  if (titleLower.includes('entry') || titleLower.includes('junior') || titleLower.includes('jr')) {
    return 'Junior';
  }
  if (titleLower.includes('senior') || titleLower.includes('sr')) {
    return 'Senior';
  }
  if (titleLower.includes('lead') || titleLower.includes('principal')) {
    return 'Lead';
  }
  if (titleLower.includes('director') || titleLower.includes('manager')) {
    return 'Management';
  }
  if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('executive')) {
    return 'Executive';
  }
  
  // Fall back to experience-based categorization
  const years = experienceYears || 5;
  if (years <= 1) return 'Entry';
  if (years <= 3) return 'Junior';
  if (years <= 6) return 'Mid';
  if (years <= 10) return 'Senior';
  if (years <= 15) return 'Lead';
  return 'Executive';
}

// =====================================================
// CANDIDATE NORMALIZATION
// =====================================================

export async function normalizeCandidateData(candidate: {
  company?: string;
  location?: string;
  job_title?: string;
  profile_summary?: string;
}) {
  const normalized: {
    company_id?: string;
    location_id?: string;
    experience_years?: number;
    seniority_level?: SeniorityLevel;
  } = {};

  try {
    // Normalize company
    if (candidate.company?.trim()) {
      const companyResult = await findOrCreateCompany(candidate.company);
      normalized.company_id = companyResult.company_id;
    }

    // Normalize location
    if (candidate.location?.trim()) {
      const locationResult = await findOrCreateLocation(candidate.location);
      normalized.location_id = locationResult.location_id;
    }

    // Extract experience and seniority
    const experienceYears = extractExperienceYears(candidate.job_title, candidate.profile_summary);
    if (experienceYears !== null) {
      normalized.experience_years = experienceYears;
    }

    normalized.seniority_level = determineSeniorityLevel(experienceYears || undefined, candidate.job_title);

    return normalized;
  } catch (error) {
    console.error('Error normalizing candidate data:', error);
    throw error;
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function bulkNormalizeCandidates(
  candidateIds: string[],
  batchSize = 50
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < candidateIds.length; i += batchSize) {
    const batch = candidateIds.slice(i, i + batchSize);
    
    try {
      // Fetch candidate data
      const { data: candidates, error: fetchError } = await supabase
        .from('saved_candidates')
        .select('id, company, location, job_title, profile_summary')
        .in('id', batch);

      if (fetchError) throw fetchError;

      // Process each candidate in the batch
      for (const candidate of candidates || []) {
        try {
          const normalized = await normalizeCandidateData(candidate);
          
          // Update candidate with normalized data
          const { error: updateError } = await supabase
            .from('saved_candidates')
            .update({
              ...normalized,
              enrichment_status: 'enriched'
            })
            .eq('id', candidate.id);

          if (updateError) throw updateError;
          processed++;
        } catch (error) {
          console.error(`Error processing candidate ${candidate.id}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      errors += batch.length;
    }
  }

  return { processed, errors };
}

// =====================================================
// ANALYTICS AND INSIGHTS
// =====================================================

export async function getEntityUsageStats() {
  try {
    // Get top companies by candidate count
    const { data: companyStats, error: companyError } = await supabase
      .from('saved_candidates')
      .select(`
        company_id,
        companies!inner(canonical_name)
      `)
      .not('company_id', 'is', null);

    if (companyError) throw companyError;

    // Get top locations by candidate count
    const { data: locationStats, error: locationError } = await supabase
      .from('saved_candidates')
      .select(`
        location_id,
        locations!inner(canonical_name)
      `)
      .not('location_id', 'is', null);

    if (locationError) throw locationError;

    // Get seniority distribution
    const { data: seniorityStats, error: seniorityError } = await supabase
      .from('saved_candidates')
      .select('seniority_level')
      .not('seniority_level', 'is', null);

    if (seniorityError) throw seniorityError;

    return {
      companyStats: companyStats || [],
      locationStats: locationStats || [],
      seniorityStats: seniorityStats || []
    };
  } catch (error) {
    console.error('Error getting entity usage stats:', error);
    throw error;
  }
}