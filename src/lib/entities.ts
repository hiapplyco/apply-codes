// Utility functions for working with normalized entities
// Supports the canonical entity management system from Phase 2.1

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
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

  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const normalizedName = companyName.trim();

  try {
    // First, try to find existing company by canonical name
    const companiesRef = collection(db, 'companies');
    const nameQuery = query(
      companiesRef,
      where('canonical_name', '==', normalizedName),
      limit(1)
    );

    const nameSnapshot = await getDocs(nameQuery);

    if (!nameSnapshot.empty) {
      const existingCompany = nameSnapshot.docs[0];
      return {
        company_id: existingCompany.id,
        canonical_name: existingCompany.data().canonical_name,
        was_created: false
      };
    }

    // Also check if the name exists in aliases (client-side check)
    const allCompaniesQuery = query(companiesRef);
    const allCompaniesSnapshot = await getDocs(allCompaniesQuery);

    for (const companyDoc of allCompaniesSnapshot.docs) {
      const companyData = companyDoc.data();
      const aliases = companyData.aliases || [];
      if (aliases.includes(normalizedName)) {
        return {
          company_id: companyDoc.id,
          canonical_name: companyData.canonical_name,
          was_created: false
        };
      }
    }

    // Company doesn't exist, create new one
    const newCompanyData = {
      canonical_name: normalizedName,
      domain: domain || null,
      industry: industry || null,
      aliases: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(companiesRef, newCompanyData);

    return {
      company_id: docRef.id,
      canonical_name: normalizedName,
      was_created: true
    };
  } catch (error) {
    console.error('Error in findOrCreateCompany:', error);
    throw error;
  }
}

export async function addCompanyAlias(companyId: string, alias: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  // Get current aliases first
  const companyRef = doc(db, 'companies', companyId);
  const companyDoc = await getDoc(companyRef);

  if (!companyDoc.exists()) {
    throw new Error('Company not found');
  }

  const currentAliases = companyDoc.data().aliases || [];
  const updatedAliases = [...currentAliases, alias];

  await updateDoc(companyRef, {
    aliases: updatedAliases,
    updated_at: serverTimestamp()
  });
}

export async function searchCompanies(searchQuery: string, limitCount = 10): Promise<CompanyEntity[]> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const companiesRef = collection(db, 'companies');
  const companiesSnapshot = await getDocs(companiesRef);

  // Client-side filtering for complex search (canonical_name and aliases)
  const companies = companiesSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at instanceof Timestamp
        ? doc.data().created_at.toDate().toISOString()
        : doc.data().created_at,
      updated_at: doc.data().updated_at instanceof Timestamp
        ? doc.data().updated_at.toDate().toISOString()
        : doc.data().updated_at
    }))
    .filter(company => {
      const nameMatch = company.canonical_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const aliasMatch = (company.aliases || []).some((alias: string) =>
        alias.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return nameMatch || aliasMatch;
    })
    .slice(0, limitCount) as CompanyEntity[];

  return companies;
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

  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const canonicalName = locationString.trim();
  const locationParts = canonicalName.split(',').map(part => part.trim());

  const parsedCity = locationParts[0] || '';
  const parsedState = locationParts[1] || undefined;
  const parsedCountry = locationParts[2] || 'United States';

  try {
    // First, try to find existing location by canonical name
    const locationsRef = collection(db, 'locations');
    const nameQuery = query(
      locationsRef,
      where('canonical_name', '==', canonicalName),
      limit(1)
    );

    const nameSnapshot = await getDocs(nameQuery);

    if (!nameSnapshot.empty) {
      const existingLocation = nameSnapshot.docs[0];
      const locationData = existingLocation.data();
      return {
        location_id: existingLocation.id,
        canonical_name: locationData.canonical_name,
        parsed_city: locationData.city,
        parsed_state: locationData.state,
        parsed_country: locationData.country,
        was_created: false
      };
    }

    // Also check if the name exists in aliases (client-side check)
    const allLocationsQuery = query(locationsRef);
    const allLocationsSnapshot = await getDocs(allLocationsQuery);

    for (const locationDoc of allLocationsSnapshot.docs) {
      const locationData = locationDoc.data();
      const aliases = locationData.aliases || [];
      if (aliases.includes(canonicalName)) {
        return {
          location_id: locationDoc.id,
          canonical_name: locationData.canonical_name,
          parsed_city: locationData.city,
          parsed_state: locationData.state,
          parsed_country: locationData.country,
          was_created: false
        };
      }
    }

    // Location doesn't exist, create new one
    const newLocationData = {
      canonical_name: canonicalName,
      city: parsedCity,
      state: parsedState || null,
      country: parsedCountry,
      aliases: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(locationsRef, newLocationData);

    return {
      location_id: docRef.id,
      canonical_name: canonicalName,
      parsed_city: parsedCity,
      parsed_state: parsedState,
      parsed_country: parsedCountry,
      was_created: true
    };
  } catch (error) {
    console.error('Error in findOrCreateLocation:', error);
    throw error;
  }
}

export async function addLocationAlias(locationId: string, alias: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  // Get current aliases first
  const locationRef = doc(db, 'locations', locationId);
  const locationDoc = await getDoc(locationRef);

  if (!locationDoc.exists()) {
    throw new Error('Location not found');
  }

  const currentAliases = locationDoc.data().aliases || [];
  const updatedAliases = [...currentAliases, alias];

  await updateDoc(locationRef, {
    aliases: updatedAliases,
    updated_at: serverTimestamp()
  });
}

export async function searchLocations(searchQuery: string, limitCount = 10): Promise<LocationEntity[]> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const locationsRef = collection(db, 'locations');
  const locationsSnapshot = await getDocs(locationsRef);

  // Client-side filtering for complex search (canonical_name, city, and aliases)
  const locations = locationsSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at instanceof Timestamp
        ? doc.data().created_at.toDate().toISOString()
        : doc.data().created_at,
      updated_at: doc.data().updated_at instanceof Timestamp
        ? doc.data().updated_at.toDate().toISOString()
        : doc.data().updated_at
    }))
    .filter(location => {
      const nameMatch = location.canonical_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const cityMatch = location.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const aliasMatch = (location.aliases || []).some((alias: string) =>
        alias.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return nameMatch || cityMatch || aliasMatch;
    })
    .slice(0, limitCount) as LocationEntity[];

  return locations;
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
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < candidateIds.length; i += batchSize) {
    const batch = candidateIds.slice(i, i + batchSize);

    try {
      // Fetch candidate data - Firestore batch get
      const candidateRefs = batch.map(id => doc(db, 'saved_candidates', id));
      const candidateDocs = await Promise.all(candidateRefs.map(ref => getDoc(ref)));

      const candidates = candidateDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      // Process each candidate in the batch
      for (const candidate of candidates) {
        try {
          const normalized = await normalizeCandidateData(candidate);

          // Update candidate with normalized data
          const candidateRef = doc(db, 'saved_candidates', candidate.id);
          await updateDoc(candidateRef, {
            ...normalized,
            enrichment_status: 'enriched',
            updated_at: serverTimestamp()
          });

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
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    // Get candidates with company data
    const candidatesRef = collection(db, 'saved_candidates');
    const candidatesWithCompanyQuery = query(
      candidatesRef,
      where('company_id', '!=', null)
    );
    const candidatesWithCompanySnapshot = await getDocs(candidatesWithCompanyQuery);
    const candidatesWithCompany = candidatesWithCompanySnapshot.docs.map(doc => doc.data());

    // Get companies data
    const companiesRef = collection(db, 'companies');
    const companiesSnapshot = await getDocs(companiesRef);
    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side join and count for company stats
    const companyStats = companies.map(company => {
      const candidateCount = candidatesWithCompany.filter(
        candidate => candidate.company_id === company.id
      ).length;
      return {
        ...company,
        candidate_count: candidateCount
      };
    }).filter(company => company.candidate_count > 0);

    // Get candidates with location data
    const candidatesWithLocationQuery = query(
      candidatesRef,
      where('location_id', '!=', null)
    );
    const candidatesWithLocationSnapshot = await getDocs(candidatesWithLocationQuery);
    const candidatesWithLocation = candidatesWithLocationSnapshot.docs.map(doc => doc.data());

    // Get locations data
    const locationsRef = collection(db, 'locations');
    const locationsSnapshot = await getDocs(locationsRef);
    const locations = locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side join and count for location stats
    const locationStats = locations.map(location => {
      const candidateCount = candidatesWithLocation.filter(
        candidate => candidate.location_id === location.id
      ).length;
      return {
        ...location,
        candidate_count: candidateCount
      };
    }).filter(location => location.candidate_count > 0);

    // Get seniority distribution
    const seniorityStatsQuery = query(
      candidatesRef,
      where('seniority_level', '!=', null)
    );
    const seniorityStatsSnapshot = await getDocs(seniorityStatsQuery);
    const seniorityStats = seniorityStatsSnapshot.docs.map(doc => ({
      seniority_level: doc.data().seniority_level
    }));

    return {
      companyStats,
      locationStats,
      seniorityStats
    };
  } catch (error) {
    console.error('Error getting entity usage stats:', error);
    throw error;
  }
}